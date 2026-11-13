import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: config.getOrThrow<string>('FRONTEND_URL'), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  if (config.get('NODE_ENV') !== 'production') {
    const doc = new DocumentBuilder().setTitle('CareerPilot AI API').setVersion('0.1').addBearerAuth().build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));
  }

  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port);
  new Logger('Bootstrap').log(`API listening on http://localhost:${port}/api (docs: /api/docs)`);
}
bootstrap();
