import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { descreverEspera, type LimiteDeTentativas } from '../common/limite-de-tentativas.js';
import type { ConteudoDoToken, DonoAutenticado } from './dono-autenticado.js';
import type { LoginDto } from './dto/login.dto.js';
import type { TrocarSenhaDto } from './dto/trocar-senha.dto.js';
import { LIMITE_POR_EMAIL, LIMITE_POR_IP } from './limites-de-login.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(LIMITE_POR_EMAIL) private readonly porEmail: LimiteDeTentativas,
    @Inject(LIMITE_POR_IP) private readonly porIp: LimiteDeTentativas,
  ) {}

  async login({ email, senha }: LoginDto, ip: string) {
    const chave = email.toLowerCase().trim();
    const agora = Date.now();

    // A trava e conferida ANTES de tocar no banco e antes do bcrypt: uma
    // requisicao barrada nao pode custar trabalho nenhum ao servidor.
    const espera = this.porEmail.esperaEmSegundos(chave, agora) ?? this.porIp.esperaEmSegundos(ip, agora);
    if (espera !== null) {
      throw new HttpException(
        `Muitas tentativas de login. Tente de novo em ${descreverEspera(espera)}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const dono = await this.prisma.dono.findUnique({
      where: { email: chave },
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
      this.anotarErro(chave, ip, agora);
      throw naoAutorizado;
    }

    const senhaConfere = await bcrypt.compare(senha, dono.senhaHash);
    if (!senhaConfere) {
      this.anotarErro(chave, ip, agora);
      throw naoAutorizado;
    }

    // Acertou: as duas travas voltam a zero. Quem sabe a senha nunca fica
    // preso do lado de fora por causa de tentativas anteriores.
    this.porEmail.limpar(chave);
    this.porIp.limpar(ip);

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

  /**
   * Troca a senha do dono logado.
   *
   * Exige a senha ATUAL junto com a nova. Sem isso, quem roubasse o cracha
   * trocaria a senha e tomaria a conta — o token sozinho nao pode bastar
   * para uma acao que expulsa a dona do proprio painel.
   */
  async trocarSenha(dono: DonoAutenticado, { senhaAtual, senhaNova }: TrocarSenhaDto) {
    const registro = await this.prisma.dono.findUnique({ where: { id: dono.id } });
    if (!registro) throw new UnauthorizedException('Sessao invalida.');

    const confere = await bcrypt.compare(senhaAtual, registro.senhaHash);
    if (!confere) {
      throw new UnauthorizedException('A senha atual esta incorreta.');
    }

    // So depois de provar quem e: trocar por uma igual nao troca nada, e
    // quem digitou isso provavelmente se enganou.
    if (senhaAtual === senhaNova) {
      throw new BadRequestException('A senha nova precisa ser diferente da atual.');
    }

    await this.prisma.dono.update({
      where: { id: registro.id },
      data: { senhaHash: await bcrypt.hash(senhaNova, 10) },
    });

    // Provou quem e: se havia tentativas fracassadas acumuladas, esquecemos.
    this.porEmail.limpar(registro.email);

    // O aviso e parte do contrato: o front mostra isso na tela.
    return {
      trocada: true,
      aviso: 'Aparelhos que ja estavam logados seguem logados ate a sessao vencer.',
    };
  }

  private anotarErro(chave: string, ip: string, agora: number) {
    this.porEmail.registrarFalha(chave, agora);
    this.porIp.registrarFalha(ip, agora);
  }
}
