// Monta a resposta do endpoint publico GET /cardapio.
//
// A ideia e o front fazer UMA unica chamada e receber tudo que a area do
// cliente precisa: itens, promocoes, taxas de entrega e as configuracoes
// publicas da lanchonete.

import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { lojaEstaAberta, minutosAgora } from '../common/horario.js';
import { caminhoDaFotoDaPromocao, caminhoDaFotoDoItem } from '../common/caminho-da-foto.js';

/** O banco guarda dinheiro como Decimal; o front espera um numero comum. */
function paraNumero(valor: Prisma.Decimal): number;
function paraNumero(valor: Prisma.Decimal | null): number | null;
function paraNumero(valor: Prisma.Decimal | null): number | null {
  return valor === null ? null : Number(valor);
}

@Injectable()
export class CardapioService {
  constructor(private readonly prisma: PrismaService) {}

  async montarCardapio() {
    // Neste MVP existe uma unica lanchonete cadastrada.
    const restaurante = await this.prisma.restaurante.findFirst({
      orderBy: { criadoEm: 'asc' },
    });

    if (!restaurante) {
      throw new NotFoundException('Nenhum restaurante cadastrado.');
    }

    const [itens, promocoes, tarifas] = await Promise.all([
      // Somente itens ligados: o item desativado nao existe para o cliente.
      this.prisma.itemCardapio.findMany({
        where: { restauranteId: restaurante.id, ativo: true },
        // Ordem de cadastro: define em que ordem as categorias aparecem
        // (a primeira cadastrada vem primeiro; uma categoria nova cai no fim).
        orderBy: { criadoEm: 'asc' },
      }),

      // Somente promocoes ligadas.
      this.prisma.promocao.findMany({
        where: { restauranteId: restaurante.id, ativa: true },
        include: { itemCardapio: true },
        orderBy: { criadoEm: 'asc' },
      }),

      this.prisma.tarifaBairro.findMany({
        where: { restauranteId: restaurante.id },
        orderBy: { bairro: 'asc' },
      }),
    ]);

    return {
      restaurante: this.montarRestaurante(restaurante),
      entrega: this.montarEntrega(restaurante, tarifas),
      categorias: this.agruparPorCategoria(itens),
      promocoes: this.montarPromocoes(promocoes),
    };
  }

  private montarRestaurante(restaurante: {
    id: string;
    nome: string;
    whatsapp: string;
    horarioAbertura: string;
    horarioFechamento: string;
    abertoManual: boolean;
    formasPagamento: string[];
  }) {
    const agora = minutosAgora();

    return {
      id: restaurante.id,
      nome: restaurante.nome,
      // Numero que o front usa para montar o link wa.me.
      whatsapp: restaurante.whatsapp,
      horarioAbertura: restaurante.horarioAbertura,
      horarioFechamento: restaurante.horarioFechamento,
      // Estado final que a pilula verde/vermelha exibe.
      aberto: lojaEstaAberta(
        restaurante.abertoManual,
        restaurante.horarioAbertura,
        restaurante.horarioFechamento,
        agora,
      ),
      formasPagamento: restaurante.formasPagamento,
    };
  }

  private montarEntrega(
    restaurante: { modoTaxaEntrega: string; taxaEntregaUnica: Prisma.Decimal | null },
    tarifas: { id: string; bairro: string; valorTaxa: Prisma.Decimal }[],
  ) {
    const porBairro = restaurante.modoTaxaEntrega === 'por_bairro';

    return {
      modo: restaurante.modoTaxaEntrega,
      // No modo "unica" nao mandamos a lista de bairros, e vice-versa:
      // o front so recebe o que faz sentido para o modo em uso.
      taxaUnica: porBairro ? null : paraNumero(restaurante.taxaEntregaUnica),
      tarifas: porBairro
        ? tarifas.map((tarifa) => ({
            id: tarifa.id,
            bairro: tarifa.bairro,
            valor: paraNumero(tarifa.valorTaxa),
          }))
        : [],
    };
  }

  private agruparPorCategoria(
    itens: {
      id: string;
      nome: string;
      descricao: string | null;
      preco: Prisma.Decimal;
      categoria: string;
      maisPedido: boolean;
      foto: Uint8Array | null;
      atualizadoEm: Date;
    }[],
  ) {
    // Os itens chegam em ordem de cadastro, entao a ordem em que cada
    // categoria entra neste Map ja e a ordem em que ela deve aparecer.
    const grupos = new Map<string, typeof itens>();

    for (const item of itens) {
      const lista = grupos.get(item.categoria) ?? [];
      lista.push(item);
      grupos.set(item.categoria, lista);
    }

    return [...grupos.entries()].map(([nome, itensDaCategoria]) => ({
      nome,
      // Dentro da categoria: os "mais pedidos" primeiro, depois alfabetico.
      itens: itensDaCategoria
        .sort(
          (a, b) =>
            Number(b.maisPedido) - Number(a.maisPedido) || a.nome.localeCompare(b.nome, 'pt-BR'),
        )
        .map((item) => this.montarItem(item)),
    }));
  }

  private montarItem(item: {
    id: string;
    nome: string;
    descricao: string | null;
    preco: Prisma.Decimal;
    categoria: string;
    maisPedido: boolean;
    foto: Uint8Array | null;
    atualizadoEm: Date;
  }) {
    return {
      id: item.id,
      nome: item.nome,
      descricao: item.descricao,
      preco: paraNumero(item.preco),
      categoria: item.categoria,
      maisPedido: item.maisPedido,
      fotoUrl: caminhoDaFotoDoItem(item.id, item.foto !== null, item.atualizadoEm),
    };
  }

  private montarPromocoes(
    promocoes: {
      id: string;
      tipo: string;
      selo: string;
      nome: string | null;
      descricao: string | null;
      precoPromocional: Prisma.Decimal;
      precoCheio: Prisma.Decimal | null;
      foto: Uint8Array | null;
      atualizadoEm: Date;
      itemCardapio: {
        id: string;
        nome: string;
        descricao: string | null;
        preco: Prisma.Decimal;
        categoria: string;
        maisPedido: boolean;
        ativo: boolean;
        foto: Uint8Array | null;
      atualizadoEm: Date;
      } | null;
    }[],
  ) {
    return (
      promocoes
        // Uma promocao de desconto que aponta para um item desligado nao deve
        // aparecer: o cliente veria um preco de algo que nao pode pedir.
        .filter((promo) => promo.tipo !== 'desconto_item' || promo.itemCardapio?.ativo)
        .map((promo) => ({
          id: promo.id,
          tipo: promo.tipo,
          selo: promo.selo,
          // No combo autonomo o nome/descricao sao proprios; no desconto em
          // item, vêm do item vinculado.
          nome: promo.nome ?? promo.itemCardapio?.nome ?? null,
          descricao: promo.descricao ?? promo.itemCardapio?.descricao ?? null,
          precoPromocional: paraNumero(promo.precoPromocional),
          // E o preco riscado no card.
          precoCheio: paraNumero(promo.precoCheio ?? promo.itemCardapio?.preco ?? null),
          fotoUrl: caminhoDaFotoDaPromocao(promo.id, promo.foto !== null, promo.atualizadoEm),
          // Presente so no tipo desconto_item: o front usa para adicionar o
          // item certo ao carrinho pelo preco promocional.
          item: promo.itemCardapio ? this.montarItem(promo.itemCardapio) : null,
        }))
    );
  }
}
