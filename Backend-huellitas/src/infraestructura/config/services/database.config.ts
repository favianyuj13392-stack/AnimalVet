import { Injectable } from '@nestjs/common';
import { MyConfigService } from '../config.service';
import { MyServerConfig } from './server.config';
import { EnviromentEnum } from '../../../compartido/enums/enviroment.enum';

@Injectable()
export class MyDataBaseConfig {
  constructor(
    private readonly config: MyConfigService,
    private readonly server: MyServerConfig,
  ) {}

  get() {
    const env = this.server.get().nodeEnv;

    const baseConfig = {
      type: this.config.get<string>('DB_TYPE'),
      host: this.config.get<string>('DB_HOST'),
      port: this.config.get<number>('DB_PORT'),
      username: this.config.get<string>('DB_USER'),
      password: this.config.get<string>('DB_PASSWORD'),
      database: this.config.get<string>('DB_NAME'),
    };

    let logging = this.config.get<boolean>('DB_LOGS');
    if (env === EnviromentEnum.PRODUCTION) {
      logging = false;
    }

    return {
      ...baseConfig,
      logging,
    };
  }
}
