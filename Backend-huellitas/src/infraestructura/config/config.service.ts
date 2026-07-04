import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class MyConfigService {
  constructor(protected readonly configService: NestConfigService) {}

  get<T>(key: string): T {
    const value = this.configService.get<T>(key);
    if (value === undefined) {
      throw new Error(`Configuration value for key "${key}" is undefined`);
    }
    return value;
  }
}
