import { Module } from '@nestjs/common';
import { ConfiguracoesController } from './configuracoes.controller.js';
import { ConfiguracoesService } from './configuracoes.service.js';

@Module({
  controllers: [ConfiguracoesController],
  providers: [ConfiguracoesService],
})
export class ConfiguracoesModule {}
