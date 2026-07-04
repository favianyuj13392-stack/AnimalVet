// src/config/cors.config.ts
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function getCorsOptions(allowedOrigins: string): CorsOptions {
  if (allowedOrigins === '*') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DOMAIN_FRONTEND must be explicit in production when credentials are enabled');
    }

    return {
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    };
  }

  const origins = allowedOrigins.split(',').map((o) => o.trim());
  return {
    origin: (origin, callback) => {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  };
}
