// CRUD das taxas de entrega por bairro (area do dono).

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AtualizarTarifaDto, CriarTarifaDto, ListarTarifasDto } from './dto/tarifa.dto.js';

/** Codigo do Postgres/Prisma para "essa combinacao unica ja existe". */
const ERRO_DUPLICADO = 'P2002';

@Injectable()
export class TarifasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(restauranteId: string, filtros: ListarTarifasDto) {
    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 5;

    const where: Prisma.TarifaBairroWhereInput = {
      restauranteId,
      ...(filtros.busca ? { bairro: { contains: filtros.busca, mode: 'insensitive' } } : {}),
    };

    const [tarifas, total] = await Promise.all([
      this.prisma.tarifaBairro.findMany({
        where,
        orderBy: { bairro: 'asc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.tarifaBairro.count({ where }),
    ]);

    return {
      tarifas: tarifas.map((tarifa) => this.formatar(tarifa)),
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.max(1, Math.ceil(total / limite)),
      },
    };
  }

  async criar(restauranteId: string, dto: CriarTarifaDto) {
    try {
      const tarifa = await this.prisma.tarifaBairro.create({
        data: { restauranteId, bairro: dto.bairro, valorTaxa: dto.valorTaxa },
      });
      return this.formatar(tarifa);
    } catch (erro) {
      this.traduzirBairroDuplicado(erro, dto.bairro);
      throw erro;
    }
  }

  async atualizar(restauranteId: string, id: string, dto: AtualizarTarifaDto) {
    const existe = await this.prisma.tarifaBairro.findFirst({
      where: { id, restauranteId },
      select: { id: true },
    });
    if (!existe) throw new NotFoundException('Bairro nao encontrado.');

    try {
      const tarifa = await this.prisma.tarifaBairro.update({
        where: { id },
        data: {
          ...(dto.bairro !== undefined && { bairro: dto.bairro }),
          ...(dto.valorTaxa !== undefined && { valorTaxa: dto.valorTaxa }),
        },
      });
      return this.formatar(tarifa);
    } catch (erro) {
      this.traduzirBairroDuplicado(erro, dto.bairro ?? '');
      throw erro;
    }
  }

  async remover(restauranteId: string, id: string) {
    const existe = await this.prisma.tarifaBairro.findFirst({
      where: { id, restauranteId },
      select: { id: true },
    });
    if (!existe) throw new NotFoundException('Bairro nao encontrado.');

    await this.prisma.tarifaBairro.delete({ where: { id } });
    return { removido: true, id };
  }

  /**
   * O banco impede o mesmo bairro duas vezes na mesma lanchonete. Aqui
   * trocamos o erro tecnico do banco por uma mensagem que o dono entende.
   */
  private traduzirBairroDuplicado(erro: unknown, bairro: string): void {
    const codigo = (erro as { code?: string })?.code;
    if (codigo === ERRO_DUPLICADO) {
      throw new ConflictException(`O bairro "${bairro}" ja esta cadastrado.`);
    }
  }

  private formatar(tarifa: { id: string; bairro: string; valorTaxa: Prisma.Decimal }) {
    return {
      id: tarifa.id,
      bairro: tarifa.bairro,
      valorTaxa: Number(tarifa.valorTaxa),
    };
  }
}
