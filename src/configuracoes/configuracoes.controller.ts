import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { DonoAtual } from '../auth/dono-atual.decorator.js';
import type { DonoAutenticado } from '../auth/dono-autenticado.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ConfiguracoesService } from './configuracoes.service.js';
import { AtualizarConfiguracoesDto } from './dto/configuracoes.dto.js';

@Controller('configuracoes')
@UseGuards(JwtAuthGuard)
export class ConfiguracoesController {
  constructor(private readonly configuracoesService: ConfiguracoesService) {}

  @Get()
  buscar(@DonoAtual() dono: DonoAutenticado) {
    return this.configuracoesService.buscar(dono.restauranteId);
  }

  @Patch()
  atualizar(@DonoAtual() dono: DonoAutenticado, @Body() dto: AtualizarConfiguracoesDto) {
    return this.configuracoesService.atualizar(dono.restauranteId, dto);
  }
}
