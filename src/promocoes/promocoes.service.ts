// CRUD das promocoes (area do dono).
//
// As regras de coerencia entre os dois tipos vivem aqui, no NestJS —
// nao no banco e nao no navegador.

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { caminhoDaFotoDaPromocao } from '../common/caminho-da-foto.js';
import { conferirFoto } from '../common/foto.js';
import type {
  AtualizarPromocaoDto,
  CriarPromocaoDto,
  ListarPromocoesDto,
} from './dto/promocao.dto.js';

@Injectable()
export class PromocoesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(restauranteId: string, filtros: ListarPromocoesDto) {
    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 6;

    const where: Prisma.PromocaoWhereInput = {
      restauranteId,
      ...(filtros.ativa !== undefined ? { ativa: filtros.ativa } : {}),
    };

    const [promocoes, total] = await Promise.all([
      this.prisma.promocao.findMany({
        where,
        include: { itemCardapio: true },
        // As ligadas primeiro, depois da mais recente para a mais antiga.
        orderBy: [{ ativa: 'desc' }, { criadoEm: 'desc' }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.promocao.count({ where }),
    ]);

    return {
      promocoes: promocoes.map((promo) => this.formatar(promo)),
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.max(1, Math.ceil(total / limite)),
      },
    };
  }

  async buscarUma(restauranteId: string, id: string) {
    const promocao = await this.prisma.promocao.findFirst({
      where: { id, restauranteId },
      include: { itemCardapio: true },
    });

    if (!promocao) throw new NotFoundException('Promocao nao encontrada.');
    return this.formatar(promocao);
  }

  async criar(restauranteId: string, dto: CriarPromocaoDto) {
    if (dto.tipo === 'desconto_item') {
      return this.criarDescontoEmItem(restauranteId, dto);
    }
    return this.criarComboAutonomo(restauranteId, dto);
  }

  private async criarDescontoEmItem(restauranteId: string, dto: CriarPromocaoDto) {
    if (!dto.itemCardapioId) {
      throw new BadRequestException(
        'Uma promocao de desconto precisa apontar para um item do cardapio.',
      );
    }

    // Confere que o item existe E que pertence a esta lanchonete.
    const item = await this.prisma.itemCardapio.findFirst({
      where: { id: dto.itemCardapioId, restauranteId },
    });
    if (!item) throw new NotFoundException('Item do cardapio nao encontrado.');

    // Se o dono nao informou o preco riscado, usamos o preco atual do item.
    const precoCheio = dto.precoCheio ?? Number(item.preco);
    this.garantirDesconto(dto.precoPromocional, precoCheio);

    const promocao = await this.prisma.promocao.create({
      data: {
        restauranteId,
        tipo: 'desconto_item',
        itemCardapioId: item.id,
        selo: dto.selo,
        precoPromocional: dto.precoPromocional,
        precoCheio,
        // No desconto o nome/descricao vem do proprio item.
        nome: null,
        descricao: dto.descricao ?? null,
        ativa: dto.ativa ?? true,
      },
      include: { itemCardapio: true },
    });

    return this.formatar(promocao);
  }

  private async criarComboAutonomo(restauranteId: string, dto: CriarPromocaoDto) {
    if (!dto.nome) {
      throw new BadRequestException('Um combo precisa de um nome proprio.');
    }
    if (dto.itemCardapioId) {
      throw new BadRequestException(
        'Um combo autonomo nao se liga a um item do cardapio. Use o tipo "desconto_item" para isso.',
      );
    }
    if (dto.precoCheio !== undefined) {
      this.garantirDesconto(dto.precoPromocional, dto.precoCheio);
    }

    const promocao = await this.prisma.promocao.create({
      data: {
        restauranteId,
        tipo: 'combo_autonomo',
        itemCardapioId: null,
        nome: dto.nome,
        descricao: dto.descricao ?? null,
        selo: dto.selo,
        precoPromocional: dto.precoPromocional,
        precoCheio: dto.precoCheio ?? null,
        ativa: dto.ativa ?? true,
      },
      include: { itemCardapio: true },
    });

    return this.formatar(promocao);
  }

  async atualizar(restauranteId: string, id: string, dto: AtualizarPromocaoDto) {
    const atual = await this.prisma.promocao.findFirst({
      where: { id, restauranteId },
      include: { itemCardapio: true },
    });
    if (!atual) throw new NotFoundException('Promocao nao encontrada.');

    // O tipo de uma promocao nao muda depois de criada: sao formularios
    // diferentes no painel. Para trocar, apaga-se e cria-se de novo.
    if (dto.itemCardapioId !== undefined) {
      if (atual.tipo !== 'desconto_item') {
        throw new BadRequestException('Um combo autonomo nao pode ser ligado a um item.');
      }
      const item = await this.prisma.itemCardapio.findFirst({
        where: { id: dto.itemCardapioId, restauranteId },
        select: { id: true },
      });
      if (!item) throw new NotFoundException('Item do cardapio nao encontrado.');
    }

    if (dto.nome !== undefined && atual.tipo === 'desconto_item') {
      throw new BadRequestException(
        'Numa promocao de desconto o nome vem do item do cardapio e nao pode ser alterado aqui.',
      );
    }

    // Confere o desconto considerando os valores que ficarao valendo.
    const precoPromocional = dto.precoPromocional ?? Number(atual.precoPromocional);
    const precoCheio =
      dto.precoCheio ??
      (atual.precoCheio === null ? null : Number(atual.precoCheio));
    if (precoCheio !== null) {
      this.garantirDesconto(precoPromocional, precoCheio);
    }

    const promocao = await this.prisma.promocao.update({
      where: { id },
      data: {
        ...(dto.selo !== undefined && { selo: dto.selo }),
        ...(dto.precoPromocional !== undefined && { precoPromocional: dto.precoPromocional }),
        ...(dto.precoCheio !== undefined && { precoCheio: dto.precoCheio }),
        ...(dto.itemCardapioId !== undefined && { itemCardapioId: dto.itemCardapioId }),
        ...(dto.nome !== undefined && { nome: dto.nome }),
        ...(dto.descricao !== undefined && { descricao: dto.descricao }),
        ...(dto.ativa !== undefined && { ativa: dto.ativa }),
      },
      include: { itemCardapio: true },
    });

    return this.formatar(promocao);
  }

  async remover(restauranteId: string, id: string) {
    const existe = await this.prisma.promocao.findFirst({
      where: { id, restauranteId },
      select: { id: true },
    });
    if (!existe) throw new NotFoundException('Promocao nao encontrada.');

    await this.prisma.promocao.delete({ where: { id } });
    return { removido: true, id };
  }

  /** Uma "promocao" que custa mais que o preco cheio nao e promocao. */
  private garantirDesconto(precoPromocional: number, precoCheio: number) {
    if (precoPromocional >= precoCheio) {
      throw new BadRequestException(
        `O preco promocional (R$ ${precoPromocional.toFixed(2)}) precisa ser menor que o preco cheio (R$ ${precoCheio.toFixed(2)}).`,
      );
    }
  }

  /** Grava a foto da promocao. Mesma conferencia do item. */
  async salvarFoto(restauranteId: string, id: string, dto: { dados: string; tipo: string }) {
    const promocao = await this.prisma.promocao.findFirst({ where: { id, restauranteId } });
    if (!promocao) throw new NotFoundException('Promocao nao encontrada.');

    const { erro, bytes } = conferirFoto(dto.dados, dto.tipo);
    if (erro || !bytes) throw new BadRequestException(erro ?? 'Nao consegui ler a imagem.');

    const salva = await this.prisma.promocao.update({
      where: { id },
      data: { foto: new Uint8Array(bytes), fotoTipo: dto.tipo },
      include: { itemCardapio: true },
    });
    return this.formatar(salva);
  }

  async removerFoto(restauranteId: string, id: string) {
    const promocao = await this.prisma.promocao.findFirst({ where: { id, restauranteId } });
    if (!promocao) throw new NotFoundException('Promocao nao encontrada.');

    const salva = await this.prisma.promocao.update({
      where: { id },
      data: { foto: null, fotoTipo: null },
      include: { itemCardapio: true },
    });
    return this.formatar(salva);
  }

  private formatar(promocao: {
    id: string;
    tipo: string;
    ativa: boolean;
    selo: string;
    nome: string | null;
    descricao: string | null;
    precoPromocional: Prisma.Decimal;
    precoCheio: Prisma.Decimal | null;
    foto: Uint8Array | null;
    atualizadoEm: Date;
    itemCardapioId: string | null;
    itemCardapio: {
      id: string;
      nome: string;
      preco: Prisma.Decimal;
      categoria: string;
      ativo: boolean;
    } | null;
  }) {
    return {
      id: promocao.id,
      tipo: promocao.tipo,
      ativa: promocao.ativa,
      selo: promocao.selo,
      nome: promocao.nome ?? promocao.itemCardapio?.nome ?? null,
      descricao: promocao.descricao,
      precoPromocional: Number(promocao.precoPromocional),
      precoCheio: promocao.precoCheio === null ? null : Number(promocao.precoCheio),
      fotoUrl: caminhoDaFotoDaPromocao(promocao.id, promocao.foto !== null, promocao.atualizadoEm),
      itemCardapioId: promocao.itemCardapioId,
      item: promocao.itemCardapio
        ? {
            id: promocao.itemCardapio.id,
            nome: promocao.itemCardapio.nome,
            preco: Number(promocao.itemCardapio.preco),
            categoria: promocao.itemCardapio.categoria,
            // O painel avisa quando a promocao aponta para um item desligado
            // (ela nao aparece para o cliente nesse caso).
            ativo: promocao.itemCardapio.ativo,
          }
        : null,
    };
  }
}
