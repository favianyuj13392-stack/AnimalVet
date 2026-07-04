import * as Joi from 'joi';
import { EnviromentEnum } from '../../compartido/enums/enviroment.enum';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid(
      EnviromentEnum.DEVELOPMENT,
      EnviromentEnum.PRODUCTION,
      EnviromentEnum.TEST,
      EnviromentEnum.DEBUG,
    )
    .default(EnviromentEnum.DEVELOPMENT),
  PORT: Joi.number().default(3000),
  SHOW_ENV: Joi.boolean().default(false),
  PRINT_LOGS: Joi.boolean().default(false),
  DOMAIN_FRONTEND: Joi.string().default('*'),

  DB_TYPE: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_LOGS: Joi.boolean().default(false),

  ACTIVE_JWT: Joi.boolean().default(true),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_TIME_EXPIRE: Joi.string().default('24h'),

  // Twilio WhatsApp (Opcional en produccion)
  TWILIO_ACCOUNT_SID: Joi.string().default('ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
  TWILIO_AUTH_TOKEN: Joi.string().default('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
  TWILIO_WHATSAPP_FROM: Joi.string().default('whatsapp:+14155238886'),

  // Email (Gmail SMTP) (Opcional en produccion)
  EMAIL_HOST: Joi.string().default('smtp.gmail.com'),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_USER: Joi.string().default('tu_correo@gmail.com'),
  EMAIL_PASS: Joi.string().default('xxxx xxxx xxxx xxxx'),
  EMAIL_FROM: Joi.string().default('Huellitas Digitales <tu_correo@gmail.com>'),
  ADMIN_EMAIL: Joi.string().default('admin@tudominio.com'),

  // Gemini y Bot (Opcional en produccion)
  GEMINI_API_KEY: Joi.string().default('tu_gemini_api_key_aqui'),
  BOT_API_KEY: Joi.string().min(16).default('genera_una_clave_aleatoria_larga_aqui_16'),

  MODO_DIOS: Joi.boolean().default(false),
});
