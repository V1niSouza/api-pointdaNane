// Ponte entre o NestJS e o banco de dados.
// Qualquer parte da API que precise ler ou gravar dados pede este servico.

import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      // O "adapter" e o driver que realmente fala com o Postgres.
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }

  // Abre a conexao quando a API sobe...
  async onModuleInit() {
    await this.$connect();
  }

  // ...e fecha quando ela e desligada.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
