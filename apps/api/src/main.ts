import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Strip unknown properties and coerce types on every request body/query (AGENTS.md §10).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Web and API are different origins; allow the configured web origin(s).
  const origins = config
    .getOrThrow<string>('CORS_ORIGIN')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({ origin: origins, credentials: true });

  const port = config.getOrThrow<number>('PORT');
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}
void bootstrap();
