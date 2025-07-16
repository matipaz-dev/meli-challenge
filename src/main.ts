import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from './shared/services/logger.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar el prefijo global /api
  app.setGlobalPrefix('api');

  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe());

  // Configurar logger personalizado
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Obtener configuración
  const configService = app.get(ConfigService);
  const port = configService.get('port');

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('MercadoLibre Challenge API')
    .setDescription(`
API REST que proporciona los endpoints necesarios para soportar una página de detalle de producto similar a MercadoLibre.

### Características Principales
- Gestión completa de productos (CRUD)
- Validaciones exhaustivas de datos
- Documentación detallada
- Tests automatizados

### Formatos
- ID de items: MLA seguido de números (ej: MLA1234567)
- Precios: Números positivos con hasta 2 decimales
- Monedas soportadas: USD, EUR, ARS
- URLs de imágenes: URLs válidas https/http
- Condición del producto: new, used, refurbished

Para más detalles, consulta el [README](https://github.com/matipaz-dev/meli-challenge) del proyecto.
    `)
    .setVersion('1.0')
    .addTag('items', 'Operaciones relacionadas con productos')
    .addServer('http://localhost:3000', 'Servidor local')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap(); 