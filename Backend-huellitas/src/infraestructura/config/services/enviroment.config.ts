import { EnviromentEnum } from 'src/compartido/enums/enviroment.enum';

export const environmentConfig = {
  [EnviromentEnum.PRODUCTION]: {
    logger: ['error', 'warn'],
    swagger: false,
  },
  [EnviromentEnum.DEVELOPMENT]: {
    logger: ['error', 'warn', 'log'],
    swagger: true,
  },
  [EnviromentEnum.TEST]: {
    logger: ['error'],
    swagger: true,
  },
  [EnviromentEnum.DEBUG]: {
    logger: ['error', 'warn', 'log', 'debug'],
    swagger: true,
  },
};
