import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MalwareScanner, NoopMalwareScanner } from './malware-scanner';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: memoryStorage(),
        limits: { fileSize: Number(config.get('MAX_UPLOAD_MB') ?? 5) * 1024 * 1024, files: 1 },
      }),
    }),
  ],
  controllers: [ResumesController],
  providers: [ResumesService, { provide: MalwareScanner, useClass: NoopMalwareScanner }],
  exports: [ResumesService],
})
export class ResumesModule {}
