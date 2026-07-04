import * as Joi from 'joi';
import { EnviromentEnum } from 'src/compartido/enums/enviroment.enum';

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

  // Twilio WhatsApp
  TWILIO_ACCOUNT_SID: Joi.string().required(),
  TWILIO_AUTH_TOKEN: Joi.string().required(),
  TWILIO_WHATSAPP_FROM: Joi.string().required(),

  // Email (Gmail SMTP)
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().required(),
  EMAIL_USER: Joi.string().email().required(),
  EMAIL_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().required(),
  ADMIN_EMAIL: Joi.string().email().required(),

  // Gemini y Bot
  GEMINI_API_KEY: Joi.string().required(),
  BOT_API_KEY: Joi.string().min(16).required(),

  MODO_DIOS: Joi.boolean().default(false),
});
