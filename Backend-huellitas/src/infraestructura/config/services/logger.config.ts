import { EnviromentEnum } from 'src/compartido/enums/enviroment.enum';
import { MyServerConfigInterface } from './server.config';

export function logServerStatus(config: MyServerConfigInterface) {
  let color: string;
  let envName: string;

  switch (config.nodeEnv) {
    case EnviromentEnum.PRODUCTION:
      color = '\x1b[31m'; // rojo
      envName = EnviromentEnum.PRODUCTION.toUpperCase();
      break;
    case EnviromentEnum.DEVELOPMENT:
      color = '\x1b[32m'; // verde
      envName = EnviromentEnum.DEVELOPMENT.toUpperCase();
      break;
    case EnviromentEnum.TEST:
      color = '\x1b[33m'; // amarillo
      envName = EnviromentEnum.TEST.toUpperCase();
      break;
    case EnviromentEnum.DEBUG:
      color = '\x1b[34m'; // azul
      envName = EnviromentEnum.DEBUG.toUpperCase();
      break;
    default:
      color = '\x1b[32m'; // verde
      envName = EnviromentEnum.DEVELOPMENT.toUpperCase();
      break;
  }

  const reset = '\x1b[0m';

  if (envName !== EnviromentEnum.DEBUG.toUpperCase()) {
    console.clear();
  }
  console.log('=========================================');
  console.log('   ☕️  CAFETERIA UCB - Server Status');
  console.log('-----------------------------------------');
  console.log(`   🚀 Application is running`);
  console.log(`   🌍 Environment : ${color}${envName}${reset}`);
  console.log(`   📡 Port        : ${color}${config.port}${reset}`);
  console.log(`   🔗 API Prefix  : ${color}/api/huellitas${reset}`);
  console.log('=========================================');
}
