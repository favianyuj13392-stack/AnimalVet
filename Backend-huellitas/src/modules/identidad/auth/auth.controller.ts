import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { TokenBlacklistService } from './token-blacklist.service';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly blacklist: TokenBlacklistService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión y obtener Token JWT' })
  @ApiResponse({ status: 200, description: 'Login exitoso, devuelve el Token.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verificar-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código OTP enviado al email (2FA para Admin y Vet)' })
  @ApiResponse({ status: 200, description: 'OTP correcto — devuelve JWT.' })
  @ApiResponse({ status: 401, description: 'Código incorrecto o expirado.' })
  verificarOtp(@Body() body: { email: string; codigo: string }) {
    return this.authService.verificarOtp(body.email, body.codigo);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión e invalidar el token JWT' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada correctamente.' })
  logout(@Req() req: any) {
    const authHeader: string = req.headers['authorization'] ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (token) this.blacklist.revoke(token);
    return { message: 'Sesión cerrada correctamente.' };
  }

  @Post('verificar-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar contraseña del usuario autenticado (para confirmar acciones sensibles)' })
  @ApiResponse({ status: 200, description: 'Contraseña correcta.' })
  @ApiResponse({ status: 401, description: 'Contraseña incorrecta.' })
  verificarPassword(
    @Req() req: any,
    @Body() body: { password: string },
  ) {
    return this.authService.verificarPassword(req.user.id, body.password);
  }
}