import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const prefix = configService.get<string>('API_PREFIX', 'api');
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');

  // ── CORS ──────────────────────────────────────────────────
   app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global prefix ─────────────────────────────────────────
  app.setGlobalPrefix(prefix);

  // ── Global validation pipe ────────────────────────────────
  // IMPORTANT : forbidNonWhitelisted = false pour permettre
  // les query params additionnels (available, categoryId, etc.)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // corrigé : était true, bloquait les query params
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Swagger (dev only) ────────────────────────────────────
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Restaurant Manager API')
      .setDescription('API complète pour la gestion de restaurant')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${prefix}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger: http://localhost:${port}/${prefix}/docs`);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Server running on http://localhost:${port}/${prefix}`);
}

bootstrap();