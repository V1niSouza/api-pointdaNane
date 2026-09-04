// O "porteiro" das rotas protegidas.
//
// Toda rota marcada com @UseGuards(JwtAuthGuard) passa por aqui antes de
// executar. Ele exige o cabecalho:
//     Authorization: Bearer <token>
// confere a assinatura do token e anexa os dados do dono a requisicao.

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { ConteudoDoToken } from './dono-autenticado.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const requisicao = contexto.switchToHttp().getRequest<Request>();
    const token = this.extrairToken(requisicao);

    if (!token) {
      throw new UnauthorizedException('E preciso estar logado para acessar isto.');
    }

    try {
      const conteudo = await this.jwtService.verifyAsync<ConteudoDoToken>(token);
      requisicao.dono = {
        id: conteudo.sub,
        email: conteudo.email,
        restauranteId: conteudo.restauranteId,
      };
      return true;
    } catch {
      // Token adulterado, vencido ou assinado com outra chave.
      throw new UnauthorizedException('Sessao invalida ou expirada. Faca login de novo.');
    }
  }

  private extrairToken(requisicao: Request): string | undefined {
    const cabecalho = requisicao.headers.authorization;
    if (!cabecalho) return undefined;

    const [tipo, valor] = cabecalho.split(' ');
    return tipo === 'Bearer' ? valor : undefined;
  }
}
