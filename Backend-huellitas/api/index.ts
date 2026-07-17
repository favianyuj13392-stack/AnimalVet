import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { MyServerConfig } from '../src/infraestructura/config/services/server.config';
import { getCorsOptions } from '../src/infraestructura/config/services/cors.config';

const server = express();
let isAppInitialized = false;

async function bootstrap() {
  if (isAppInitialized) {
    return server;
  }

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    { logger: ['error', 'warn', 'log'] }
  );

  const myServer = app.get(MyServerConfig).get();

  app.use(helmet());
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));
  app.setGlobalPrefix('api/animalvet');

  const corsOptions = getCorsOptions(myServer.domainFrontend);
  app.enableCors(corsOptions);

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: false,
    },
  }));

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.init();
  isAppInitialized = true;
  return server;
}

export default async (req: any, res: any) => {
  await bootstrap();
  server(req, res);
};
