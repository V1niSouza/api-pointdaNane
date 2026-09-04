// Deixa o PrismaService disponivel para toda a API sem precisar importar
// este modulo em cada lugar (@Global faz esse papel).

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
