import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MyServerConfig } from './infraestructura/config/services/server.config';
import { EnviromentEnum } from './compartido/enums/enviroment.enum';
import { environmentConfig } from './infraestructura/config/services/enviroment.config';
import { getCorsOptions } from './infraestructura/config/services/cors.config';
import { logServerStatus } from './infraestructura/config/services/logger.config';

async function bootstrap() {
    const config = environmentConfig[process.env.NODE_ENV ?? EnviromentEnum.DEVELOPMENT]
    const app = await NestFactory.create(AppModule, {
        logger: config.logger
    });
    const myServer = app.get(MyServerConfig).get();

    app.use(helmet());
    app.use(json({ limit: '5mb' }));
    app.use(urlencoded({ extended: true, limit: '5mb' }));
    app.setGlobalPrefix('api/huellitas');

    if (config.swagger) {
        const config = new DocumentBuilder()
            // 👇 Textos actualizados para el proyecto de la clínica
            .setTitle('Backend de la Clínica Huellitas') 
            .setDescription('Documentación para el backend de la clínica veterinaria')
            .setVersion('1.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                'access-token',
            )
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/documentation', app, document);
    }

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

    // 👇 AÑADIMOS EL INTERCEPTOR GLOBAL AQUÍ 👇
    // Esto es lo que activa la censura de los @Exclude() en todo el sistema
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    await app.listen(myServer.port);
    logServerStatus(myServer);
}
if (!process.env.VERCEL) {
    bootstrap();
}
