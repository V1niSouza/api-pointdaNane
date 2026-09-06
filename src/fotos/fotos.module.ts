import { Module } from '@nestjs/common';
import { FotosController } from './fotos.controller.js';

@Module({ controllers: [FotosController] })
export class FotosModule {}
