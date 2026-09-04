import { Module } from '@nestjs/common';
import { CardapioController } from './cardapio.controller.js';
import { CardapioService } from './cardapio.service.js';

@Module({
  controllers: [CardapioController],
  providers: [CardapioService],
})
export class CardapioModule {}
