import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Habilitar CORS para comunicación con el Frontend
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 2. Validación global de DTOs con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 3. Configuración interactiva de Swagger
  const config = new DocumentBuilder()
    .setTitle('SaludPública Connect - API REST')
    .setDescription(
      'Sistema de Gestión de Turnos para Centros de Salud Públicos\n' +
      'SENA ADSO - Ficha 3139687\n' +
      'Autor / Instructor: Carlos Chaparro',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese su token JWT de autenticación',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Documentación API - SaludPública Connect',
  });

  // 4. Iniciar servidor en el puerto 3001
  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 Servidor Backend activo en: http://localhost:${port}`);
  logger.log(`📚 Documentación interactiva de APIs (Swagger): http://localhost:${port}/api`);
}

bootstrap();
