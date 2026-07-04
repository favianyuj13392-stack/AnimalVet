import { Injectable } from '@nestjs/common';
import { MyConfigService } from '../config.service';
import { EnviromentEnum } from '../../../compartido/enums/enviroment.enum';

export interface MyServerConfigInterface {
  nodeEnv: string;
  domainFrontend: string;
  port: number;
  showEnv: boolean;
  logs: boolean;
}

@Injectable()
export class MyServerConfig {
  constructor(private readonly config: MyConfigService) {}

  get(): MyServerConfigInterface {
    if (process.env.NODE_ENV === EnviromentEnum.PRODUCTION) {
      return {
        nodeEnv: this.config.get<string>('NODE_ENV'),
        domainFrontend: this.config.get<string>('DOMAIN_FRONTEND'),
        port: this.config.get<number>('PORT'),
        showEnv: false,
        logs: false,
      };
    }
    return {
      nodeEnv: this.config.get<string>('NODE_ENV'),
      domainFrontend: this.config.get<string>('DOMAIN_FRONTEND'),
      port: this.config.get<number>('PORT'),
      showEnv: this.config.get<boolean>('SHOW_ENV'),
      logs: this.config.get<boolean>('PRINT_LOGS'),
    };
  }
}
