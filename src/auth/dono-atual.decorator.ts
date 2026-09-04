// Atalho para pegar o dono logado dentro de um controller:
//
//     listar(@DonoAtual() dono: DonoAutenticado) { ... dono.restauranteId ... }
//
// Os dados vem do cracha conferido pelo JwtAuthGuard, nunca da URL ou do
// corpo da requisicao — que o cliente poderia forjar.

import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { DonoAutenticado } from './dono-autenticado.js';

export const DonoAtual = createParamDecorator(
  (_dado: unknown, contexto: ExecutionContext): DonoAutenticado => {
    const requisicao = contexto.switchToHttp().getRequest<Request>();
    // O guard sempre roda antes e garante que isto existe.
    return requisicao.dono!;
  },
);
