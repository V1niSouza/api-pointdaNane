// CRUD dos itens do cardapio (area do dono).
//
// Regra que vale para TODOS os metodos: nada e buscado ou alterado sem
// filtrar pelo restauranteId que veio no cracha. Um id de item de outra
// lanchonete simplesmente "nao existe" para este dono.

import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AtualizarItemDto, CriarItemDto, ListarItensDto } from './dto/item.dto.js';

@Injectable()
export class ItensService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(restauranteId: string, filtros: ListarItensDto) {
    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 6;

    const where: Prisma.ItemCardapioWhereInput = {
      restauranteId,
      ...(filtros.categoria ? { categoria: filtros.categoria } : {}),
      // A busca do design atravessa todas as categorias e procura tanto no
      // nome quanto na descricao, ignorando maiusculas/minusculas.
      ...(filtros.busca
        ? {
            OR: [
              { nome: { contains: filtros.busca, mode: 'insensitive' } },
              { descricao: { contains: filtros.busca, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [itens, total, categorias] = await Promise.all([
      this.prisma.itemCardapio.findMany({
        where,
        orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.itemCardapio.count({ where }),
      // Lista de categorias existentes, para o front montar as abas e o
      // autocompletar do formulario.
      this.prisma.itemCardapio.findMany({
        where: { restauranteId },
        select: { categoria: true },
        distinct: ['categoria'],
        orderBy: { criadoEm: 'asc' },
      }),
    ]);

    return {
      itens: itens.map((item) => this.formatar(item)),
      categorias: categorias.map((c) => c.categoria),
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.max(1, Math.ceil(total / limite)),
      },
    };
  }

  async buscarUm(restauranteId: string, id: string) {
    const item = await this.prisma.itemCardapio.findFirst({
      where: { id, restauranteId },
    });

    if (!item) throw new NotFoundException('Item nao encontrado.');
    return this.formatar(item);
  }

  async criar(restauranteId: string, dto: CriarItemDto) {
    const item = await this.prisma.itemCardapio.create({
      data: {
        restauranteId,
        nome: dto.nome,
        descricao: dto.descricao ?? null,
        preco: dto.preco,
        categoria: dto.categoria,
        maisPedido: dto.maisPedido ?? false,
        ativo: dto.ativo ?? true,
      },
    });

    return this.formatar(item);
  }

  async atualizar(restauranteId: string, id: string, dto: AtualizarItemDto) {
    // Confere que o item e mesmo desta lanchonete antes de alterar.
    await this.garantirQueExiste(restauranteId, id);

    const item = await this.prisma.itemCardapio.update({
      where: { id },
      data: {
        ...(dto.nome !== undefined && { nome: dto.nome }),
        ...(dto.descricao !== undefined && { descricao: dto.descricao }),
        ...(dto.preco !== undefined && { preco: dto.preco }),
        ...(dto.categoria !== undefined && { categoria: dto.categoria }),
        ...(dto.maisPedido !== undefined && { maisPedido: dto.maisPedido }),
        ...(dto.ativo !== undefined && { ativo: dto.ativo }),
      },
    });

    return this.formatar(item);
  }

  async remover(restauranteId: string, id: string) {
    await this.garantirQueExiste(restauranteId, id);

    // Apagar o item leva junto as promocoes que apontavam para ele
    // (definido como cascata no schema.prisma).
    await this.prisma.itemCardapio.delete({ where: { id } });
    return { removido: true, id };
  }

  private async garantirQueExiste(restauranteId: string, id: string) {
    const existe = await this.prisma.itemCardapio.findFirst({
      where: { id, restauranteId },
      select: { id: true },
    });

    if (!existe) throw new NotFoundException('Item nao encontrado.');
  }

  private formatar(item: {
    id: string;
    nome: string;
    descricao: string | null;
    preco: Prisma.Decimal;
    categoria: string;
    maisPedido: boolean;
    ativo: boolean;
    fotoUrl: string | null;
  }) {
    return {
      id: item.id,
      nome: item.nome,
      descricao: item.descricao,
      // O banco guarda Decimal; o front espera numero.
      preco: Number(item.preco),
      categoria: item.categoria,
      maisPedido: item.maisPedido,
      ativo: item.ativo,
      fotoUrl: item.fotoUrl,
    };
  }
}
