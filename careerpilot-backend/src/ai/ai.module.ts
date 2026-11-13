import { Global, Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { ResumeParserService } from './resume-parser.service';

@Global()
@Module({ providers: [GeminiService, ResumeParserService], exports: [GeminiService, ResumeParserService] })
export class AiModule {}
