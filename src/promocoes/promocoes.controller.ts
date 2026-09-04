import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DonoAtual } from '../auth/dono-atual.decorator.js';
import type { DonoAutenticado } from '../auth/dono-autenticado.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import {
  AtualizarPromocaoDto,
  CriarPromocaoDto,
  ListarPromocoesDto,
} from './dto/promocao.dto.js';
import { PromocoesService } from './promocoes.service.js';

@Controller('promocoes')
@UseGuards(JwtAuthGuard)
export class PromocoesController {
  constructor(private readonly promocoesService: PromocoesService) {}

  @Get()
  listar(@DonoAtual() dono: DonoAutenticado, @Query() filtros: ListarPromocoesDto) {
    return this.promocoesService.listar(dono.restauranteId, filtros);
  }

  @Get(':id')
  buscarUma(@DonoAtual() dono: DonoAutenticado, @Param('id', ParseUUIDPipe) id: string) {
    return this.promocoesService.buscarUma(dono.restauranteId, id);
  }

  @Post()
  criar(@DonoAtual() dono: DonoAutenticado, @Body() dto: CriarPromocaoDto) {
    return this.promocoesService.criar(dono.restauranteId, dto);
  }

  /** Serve para editar e para o interruptor de ligar/desligar. */
  @Patch(':id')
  atualizar(
    @DonoAtual() dono: DonoAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarPromocaoDto,
  ) {
    return this.promocoesService.atualizar(dono.restauranteId, id, dto);
  }

  @Delete(':id')
  remover(@DonoAtual() dono: DonoAutenticado, @Param('id', ParseUUIDPipe) id: string) {
    return this.promocoesService.remover(dono.restauranteId, id);
  }
}
