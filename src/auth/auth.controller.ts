import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { DonoAtual } from './dono-atual.decorator.js';
import type { DonoAutenticado } from './dono-autenticado.js';
import { LoginDto } from './dto/login.dto.js';
import { TrocarSenhaDto } from './dto/trocar-senha.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Rota publica: e por aqui que o dono entra. */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    // O IP entra na conta das tentativas fracassadas (ver limites-de-login).
    return this.authService.login(dto, ip);
  }

  /** Troca a senha do dono logado. Exige a senha atual junto com a nova. */
  @Patch('senha')
  @UseGuards(JwtAuthGuard)
  trocarSenha(@DonoAtual() dono: DonoAutenticado, @Body() dto: TrocarSenhaDto) {
    return this.authService.trocarSenha(dono, dto);
  }

  /** Diz quem esta logado. O front usa para validar a sessao guardada. */
  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  perfil(@DonoAtual() dono: DonoAutenticado) {
    return this.authService.perfil(dono);
  }
}
