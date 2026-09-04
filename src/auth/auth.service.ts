import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ConteudoDoToken, DonoAutenticado } from './dono-autenticado.js';
import type { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login({ email, senha }: LoginDto) {
    const dono = await this.prisma.dono.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { restaurante: { select: { id: true, nome: true } } },
    });

    // Mensagem propositalmente igual para e-mail inexistente e senha errada:
    // se fossem diferentes, daria para descobrir quais e-mails existem.
    const naoAutorizado = new UnauthorizedException('E-mail ou senha incorretos.');

    if (!dono) {
      // Mesmo sem encontrar o dono, gastamos o tempo de uma comparacao de
      // senha. Sem isso, uma resposta rapida demais entregaria que o e-mail
      // nao existe.
      await bcrypt.compare(senha, '$2b$10$invalidoinvalidoinvalidoinvalidoinvalidoinvalidoinvalido');
      throw naoAutorizado;
    }

    const senhaConfere = await bcrypt.compare(senha, dono.senhaHash);
    if (!senhaConfere) throw naoAutorizado;

    const conteudo: ConteudoDoToken = {
      sub: dono.id,
      email: dono.email,
      restauranteId: dono.restauranteId,
    };

    return {
      // O front guarda este token e o manda em toda chamada protegida.
      token: await this.jwtService.signAsync(conteudo),
      dono: {
        id: dono.id,
        email: dono.email,
        restauranteId: dono.restauranteId,
        restauranteNome: dono.restaurante.nome,
      },
    };
  }

  /** Usado pelo front para saber se a sessao guardada ainda vale. */
  async perfil(dono: DonoAutenticado) {
    const registro = await this.prisma.dono.findUnique({
      where: { id: dono.id },
      include: { restaurante: { select: { nome: true } } },
    });

    if (!registro) throw new UnauthorizedException('Sessao invalida.');

    return {
      id: registro.id,
      email: registro.email,
      restauranteId: registro.restauranteId,
      restauranteNome: registro.restaurante.nome,
    };
  }
}
