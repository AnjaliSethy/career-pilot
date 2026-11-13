import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ResumesService } from '../resumes/resumes.service';
import { updateProfileSchema, UpdateProfileInput } from './profile.schema';
import { ProfilesService } from './profiles.service';

const parseSchema = z.object({ resumeId: z.string().min(1) });

@ApiTags('profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService, private readonly resumes: ResumesService) {}

  @Get()
  get(@CurrentUser() u: AuthUser) {
    return this.profiles.get(u.id);
  }

  @Put()
  update(@CurrentUser() u: AuthUser, @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput) {
    return this.profiles.update(u.id, body);
  }

  /** Extracts structured data from an uploaded resume. Returns it for review; does NOT modify the profile. */
  @Post('parse-resume')
  @HttpCode(200)
  parseResume(@CurrentUser() u: AuthUser, @Body(new ZodValidationPipe(parseSchema)) body: { resumeId: string }) {
    return this.resumes.parse(u.id, body.resumeId);
  }
}
