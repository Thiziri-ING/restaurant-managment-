import { NestFactory } from '@nestjs/core';
import {
  INestApplication,
  ValidationPipe,
  Logger,
  VersioningType,
} from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(
    AppModule,
    new FastifyAdapter({ logger: false }),
  ) as unknown as INestApplication;

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const prefix = configService.get<string>('API_PREFIX', 'api');
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:5173');

  // ── CORS ──────────────────────────────────────────────────
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const allowedLocalOrigins = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
      const allowedOrigins = [frontendUrl, 'app://restaurant-manager'];

      if (allowedOrigins.includes(origin) || allowedLocalOrigins.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global prefix ─────────────────────────────────────────
  app.setGlobalPrefix(prefix);

  // ── Versioning ────────────────────────────────────────────
  app.enableVersioning({ type: VersioningType.URI });

  // ── Global validation pipe ────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
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

    const document = SwaggerModule.createDocument(app as any, config);
    SwaggerModule.setup(`${prefix}/docs`, app as any, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger: http://localhost:${port}/${prefix}/docs`);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Server running on http://localhost:${port}/${prefix}`);
}

bootstrap();
