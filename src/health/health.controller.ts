// Endpoint de diagnostico: serve so para conferir, pelo navegador, que a
// API esta no ar E que ela consegue conversar com o banco de dados.
// Nao faz parte do produto; e uma ferramenta nossa de desenvolvimento.

import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async verificar() {
    try {
      const [restaurantes, itens, promocoes, tarifas, donos] = await Promise.all([
        this.prisma.restaurante.count(),
        this.prisma.itemCardapio.count(),
        this.prisma.promocao.count(),
        this.prisma.tarifaBairro.count(),
        this.prisma.dono.count(),
      ]);

      return {
        api: 'ok',
        banco: 'ok',
        registros: { restaurantes, donos, itens, promocoes, tarifas },
      };
    } catch (erro) {
      return {
        api: 'ok',
        banco: 'falhou',
        detalhe: erro instanceof Error ? erro.message : String(erro),
      };
    }
  }
}
