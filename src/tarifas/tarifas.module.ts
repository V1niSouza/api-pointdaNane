import { Module } from '@nestjs/common';
import { TarifasController } from './tarifas.controller.js';
import { TarifasService } from './tarifas.service.js';

@Module({
  controllers: [TarifasController],
  providers: [TarifasService],
})
export class TarifasModule {}
