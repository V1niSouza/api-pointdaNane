import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CardapioModule } from './cardapio/cardapio.module.js';
import { ConfiguracoesModule } from './configuracoes/configuracoes.module.js';
import { HealthController } from './health/health.controller.js';
import { ItensModule } from './itens/itens.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PromocoesModule } from './promocoes/promocoes.module.js';
import { TarifasModule } from './tarifas/tarifas.module.js';

@Module({
  imports: [
    // Le o arquivo .env e disponibiliza as variaveis para toda a API.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,

    // Publico (area do cliente)
    CardapioModule,

    // Protegido por login (area do dono)
    ItensModule,
    PromocoesModule,
    TarifasModule,
    ConfiguracoesModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
