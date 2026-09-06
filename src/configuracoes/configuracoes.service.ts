// Configuracoes da lanchonete (area do dono).

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { lojaEstaAberta } from '../common/horario.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { FORMAS_PAGAMENTO, type AtualizarConfiguracoesDto } from './dto/configuracoes.dto.js';
import { exigeBairrosCadastrados } from '../common/modo-de-entrega.js';

@Injectable()
export class ConfiguracoesService {
  constructor(private readonly prisma: PrismaService) {}

  async buscar(restauranteId: string) {
    const restaurante = await this.prisma.restaurante.findUnique({
      where: { id: restauranteId },
    });
    if (!restaurante) throw new NotFoundException('Restaurante nao encontrado.');

    return this.formatar(restaurante);
  }

  async atualizar(restauranteId: string, dto: AtualizarConfiguracoesDto) {
    const atual = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
    if (!atual) throw new NotFoundException('Restaurante nao encontrado.');

    // Como o dono pode mandar so um campo, verificamos as regras contra os
    // valores que FICARAO valendo, misturando o que veio com o que ja existe.
    const modo = dto.modoTaxaEntrega ?? atual.modoTaxaEntrega;
    const taxaUnica =
      dto.taxaEntregaUnica !== undefined
        ? dto.taxaEntregaUnica
        : atual.taxaEntregaUnica === null
          ? null
          : Number(atual.taxaEntregaUnica);

    if (modo === 'unica' && (taxaUnica === null || taxaUnica === undefined)) {
      throw new BadRequestException(
        'No modo de taxa unica e preciso informar o valor da taxa de entrega.',
      );
    }

    // No modo por bairro a taxa unica nao vale nada, entao a limpamos para
    // nao ficar um valor antigo esquecido no banco.
    const taxaParaGravar = modo === 'por_bairro' ? null : taxaUnica;

    // Confere o que o pedido PEDE, e nao o modo resultante: senao uma loja
    // ja em "por bairro" que ficou sem bairros trava toda e qualquer
    // configuracao, ate a chave de abrir e fechar. Ver common/modo-de-entrega.
    if (exigeBairrosCadastrados(dto.modoTaxaEntrega)) {
      const bairros = await this.prisma.tarifaBairro.count({ where: { restauranteId } });
      if (bairros === 0) {
        throw new BadRequestException(
          'Cadastre pelo menos um bairro antes de usar o modo de taxa por bairro.',
        );
      }
    }

    const restaurante = await this.prisma.restaurante.update({
      where: { id: restauranteId },
      data: {
        ...(dto.nome !== undefined && { nome: dto.nome }),
        ...(dto.whatsapp !== undefined && { whatsapp: dto.whatsapp }),
        ...(dto.horarioAbertura !== undefined && { horarioAbertura: dto.horarioAbertura }),
        ...(dto.horarioFechamento !== undefined && { horarioFechamento: dto.horarioFechamento }),
        ...(dto.abertoManual !== undefined && { abertoManual: dto.abertoManual }),
        ...(dto.formasPagamento !== undefined && { formasPagamento: dto.formasPagamento }),
        ...(dto.modoTaxaEntrega !== undefined && { modoTaxaEntrega: dto.modoTaxaEntrega }),
        taxaEntregaUnica: taxaParaGravar,
      },
    });

    return this.formatar(restaurante);
  }

  private formatar(restaurante: {
    id: string;
    nome: string;
    whatsapp: string;
    horarioAbertura: string;
    horarioFechamento: string;
    abertoManual: boolean;
    formasPagamento: string[];
    modoTaxaEntrega: string;
    taxaEntregaUnica: Prisma.Decimal | null;
  }) {
    return {
      id: restaurante.id,
      nome: restaurante.nome,
      whatsapp: restaurante.whatsapp,
      horarioAbertura: restaurante.horarioAbertura,
      horarioFechamento: restaurante.horarioFechamento,
      // A chave que o dono controla...
      abertoManual: restaurante.abertoManual,
      // ...e o estado real, ja cruzado com o horario. O painel mostra os dois:
      // "voce deixou aberto, mas esta fora do horario" e uma informacao util.
      aberto: lojaEstaAberta(
        restaurante.abertoManual,
        restaurante.horarioAbertura,
        restaurante.horarioFechamento,
      ),
      formasPagamento: restaurante.formasPagamento,
      // Lista completa, para o painel desenhar as caixinhas de marcar.
      formasPagamentoDisponiveis: [...FORMAS_PAGAMENTO],
      modoTaxaEntrega: restaurante.modoTaxaEntrega,
      taxaEntregaUnica:
        restaurante.taxaEntregaUnica === null ? null : Number(restaurante.taxaEntregaUnica),
    };
  }
}
