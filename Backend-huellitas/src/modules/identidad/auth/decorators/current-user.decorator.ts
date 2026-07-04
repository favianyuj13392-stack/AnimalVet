import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    // Si pasamos un string (ej: @CurrentUser('id')), devuelve solo esa propiedad
    // Si no pasamos nada, devuelve el objeto usuario completo del payload JWT
    return data ? user?.[data] : user;
  },
);