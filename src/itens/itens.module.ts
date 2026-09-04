import { Module } from '@nestjs/common';
import { ItensController } from './itens.controller.js';
import { ItensService } from './itens.service.js';

@Module({
  controllers: [ItensController],
  providers: [ItensService],
})
export class ItensModule {}
