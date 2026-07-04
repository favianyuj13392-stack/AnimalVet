import { Injectable } from '@nestjs/common';
import { MyConfigService } from '../config.service';
import { MyServerConfig } from './server.config';
import { EnviromentEnum } from 'src/compartido/enums/enviroment.enum';

@Injectable()
export class MyJwtConfig {
  constructor(
    private readonly config: MyConfigService,
    private readonly server: MyServerConfig,
  ) {}
  get() {
    if (this.server.get().nodeEnv === EnviromentEnum.PRODUCTION) {
      return {
        isActive: true,
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_TIME_EXPIRE'),
      };
    }
    return {
      isActive: this.config.get<boolean>('ACTIVE_JWT'),
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_TIME_EXPIRE'),
    };
  }
}
