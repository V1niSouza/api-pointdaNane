import { Module } from '@nestjs/common';
import { PromocoesController } from './promocoes.controller.js';
import { PromocoesService } from './promocoes.service.js';

@Module({
  controllers: [PromocoesController],
  providers: [PromocoesService],
})
export class PromocoesModule {}
