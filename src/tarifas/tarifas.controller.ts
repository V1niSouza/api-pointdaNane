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
import { AtualizarTarifaDto, CriarTarifaDto, ListarTarifasDto } from './dto/tarifa.dto.js';
import { TarifasService } from './tarifas.service.js';

@Controller('tarifas')
@UseGuards(JwtAuthGuard)
export class TarifasController {
  constructor(private readonly tarifasService: TarifasService) {}

  @Get()
  listar(@DonoAtual() dono: DonoAutenticado, @Query() filtros: ListarTarifasDto) {
    return this.tarifasService.listar(dono.restauranteId, filtros);
  }

  @Post()
  criar(@DonoAtual() dono: DonoAutenticado, @Body() dto: CriarTarifaDto) {
    return this.tarifasService.criar(dono.restauranteId, dto);
  }

  @Patch(':id')
  atualizar(
    @DonoAtual() dono: DonoAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarTarifaDto,
  ) {
    return this.tarifasService.atualizar(dono.restauranteId, id, dto);
  }

  @Delete(':id')
  remover(@DonoAtual() dono: DonoAutenticado, @Param('id', ParseUUIDPipe) id: string) {
    return this.tarifasService.remover(dono.restauranteId, id);
  }
}
