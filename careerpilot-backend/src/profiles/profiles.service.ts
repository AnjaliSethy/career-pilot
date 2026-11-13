import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileInput } from './profile.schema';

const include = {
  skills: { orderBy: { name: 'asc' as const } },
  education: true,
  experiences: true,
  projects: true,
  certifications: true,
};

const blankToNull = (v: string | null | undefined) => (v === '' || v === undefined ? null : v);

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async get(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId }, include });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  /**
   * Full-replace semantics for each list that is present in the payload; omitted lists are untouched.
   * Runs in one transaction so a failed update never leaves a half-written profile.
   */
  async update(userId: string, input: UpdateProfileInput) {
    const current = await this.get(userId);
    const { skills, education, experiences, projects, certifications, sourceResumeId, ...scalars } = input;

    const data = {
      ...scalars,
      professionalEmail: blankToNull(scalars.professionalEmail),
      portfolioUrl: blankToNull(scalars.portfolioUrl),
      githubUrl: blankToNull(scalars.githubUrl),
      linkedinUrl: blankToNull(scalars.linkedinUrl),
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.userProfile.update({ where: { id: current.id }, data });
      if (skills) {
        await tx.skill.deleteMany({ where: { profileId: current.id } });
        const unique = [...new Map(skills.map((s) => [s.name.toLowerCase(), s])).values()];
        await tx.skill.createMany({
          data: unique.map((s) => ({ profileId: current.id, name: s.name, category: s.category ?? null })),
        });
      }
      if (education) {
        await tx.education.deleteMany({ where: { profileId: current.id } });
        await tx.education.createMany({
          data: education.map((e) => ({ ...e, field: e.field ?? null, startYear: e.startYear ?? null, endYear: e.endYear ?? null, profileId: current.id })),
        });
      }
      if (experiences) {
        await tx.experience.deleteMany({ where: { profileId: current.id } });
        await tx.experience.createMany({
          data: experiences.map((e) => ({
            ...e,
            location: e.location ?? null,
            startDate: e.startDate ?? null,
            endDate: e.endDate ?? null,
            description: e.description ?? null,
            profileId: current.id,
          })),
        });
      }
      if (projects) {
        await tx.project.deleteMany({ where: { profileId: current.id } });
        await tx.project.createMany({
          data: projects.map((p) => ({ ...p, description: p.description ?? null, url: blankToNull(p.url), profileId: current.id })),
        });
      }
      if (certifications) {
        await tx.certification.deleteMany({ where: { profileId: current.id } });
        await tx.certification.createMany({
          data: certifications.map((c) => ({ ...c, issuer: c.issuer ?? null, year: c.year ?? null, profileId: current.id })),
        });
      }
      if (sourceResumeId) {
        await tx.resume.updateMany({ where: { id: sourceResumeId, userId }, data: { reviewedByUser: true } });
      }
    });

    await this.audit.log(userId, 'profile.update', 'UserProfile', current.id, {
      fields: Object.keys(input).filter((k) => (input as Record<string, unknown>)[k] !== undefined),
    });
    return this.get(userId);
  }
}
