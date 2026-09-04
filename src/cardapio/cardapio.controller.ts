// Endpoint PUBLICO: nao exige login. E a unica chamada que a area do
// cliente precisa fazer para montar o cardapio inteiro.

import { Controller, Get } from '@nestjs/common';
import { CardapioService } from './cardapio.service.js';

@Controller('cardapio')
export class CardapioController {
  constructor(private readonly cardapioService: CardapioService) {}

  @Get()
  buscar() {
    return this.cardapioService.montarCardapio();
  }
}
