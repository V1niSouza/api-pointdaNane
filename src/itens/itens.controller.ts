import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DonoAtual } from '../auth/dono-atual.decorator.js';
import type { DonoAutenticado } from '../auth/dono-autenticado.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import {
  AtualizarItemDto,
  CriarItemDto,
  EnviarFotoDto,
  ListarItensDto,
} from './dto/item.dto.js';
import { ItensService } from './itens.service.js';

// O @UseGuards aqui em cima vale para TODAS as rotas deste controller:
// nenhuma delas responde sem o cracha do dono.
@Controller('itens')
@UseGuards(JwtAuthGuard)
export class ItensController {
  constructor(private readonly itensService: ItensService) {}

  @Get()
  listar(@DonoAtual() dono: DonoAutenticado, @Query() filtros: ListarItensDto) {
    return this.itensService.listar(dono.restauranteId, filtros);
  }

  @Get(':id')
  buscarUm(@DonoAtual() dono: DonoAutenticado, @Param('id', ParseUUIDPipe) id: string) {
    return this.itensService.buscarUm(dono.restauranteId, id);
  }

  @Post()
  criar(@DonoAtual() dono: DonoAutenticado, @Body() dto: CriarItemDto) {
    return this.itensService.criar(dono.restauranteId, dto);
  }

  /** Serve tanto para editar quanto para o interruptor de ligar/desligar. */
  @Patch(':id')
  atualizar(
    @DonoAtual() dono: DonoAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarItemDto,
  ) {
    return this.itensService.atualizar(dono.restauranteId, id, dto);
  }

  @Delete(':id')
  remover(@DonoAtual() dono: DonoAutenticado, @Param('id', ParseUUIDPipe) id: string) {
    return this.itensService.remover(dono.restauranteId, id);
  }

  /** A entrega da foto e publica e mora em FotosController; aqui so o envio. */
  @Put(':id/foto')
  enviarFoto(
    @DonoAtual() dono: DonoAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnviarFotoDto,
  ) {
    return this.itensService.salvarFoto(dono.restauranteId, id, dto);
  }

  @Delete(':id/foto')
  removerFoto(@DonoAtual() dono: DonoAutenticado, @Param('id', ParseUUIDPipe) id: string) {
    return this.itensService.removerFoto(dono.restauranteId, id);
  }
}
