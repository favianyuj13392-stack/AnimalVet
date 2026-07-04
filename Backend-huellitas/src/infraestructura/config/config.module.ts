import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { MyConfigService } from './config.service';
import { MyDataBaseConfig } from './services/database.config';
import { MyJwtConfig } from './services/jwt.config';
import { MyServerConfig } from './services/server.config';
import { validationSchema } from './config.validation';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema,
    }),
  ],
  providers: [MyConfigService, MyDataBaseConfig, MyJwtConfig, MyServerConfig],
  exports: [MyConfigService, MyDataBaseConfig, MyJwtConfig, MyServerConfig],
})
export class MyConfigModule {}
