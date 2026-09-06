// Entrega das fotos, sem login.
//
// Fica num controller PROPRIO porque as rotas de item e de promocao exigem o
// cracha do dono na classe inteira, e a foto precisa ser publica: quem abre o
// cardapio nao esta logado.
//
// As respostas sao guardadas pelo navegador por um ano. Isso e seguro porque
// o endereco carrega a versao (?v=...): trocar a foto muda o endereco, e o
// navegador busca de novo sozinho.

import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  StreamableFile,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller()
export class FotosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('itens/:id/foto')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async fotoDoItem(@Param('id', ParseUUIDPipe) id: string) {
    const item = await this.prisma.itemCardapio.findUnique({
      where: { id },
      select: { foto: true, fotoTipo: true },
    });
    return this.entregar(item);
  }

  @Get('promocoes/:id/foto')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async fotoDaPromocao(@Param('id', ParseUUIDPipe) id: string) {
    const promocao = await this.prisma.promocao.findUnique({
      where: { id },
      select: { foto: true, fotoTipo: true },
    });
    return this.entregar(promocao);
  }

  private entregar(registro: { foto: Uint8Array | null; fotoTipo: string | null } | null) {
    if (!registro?.foto) throw new NotFoundException('Este registro nao tem foto.');

    // O Nest cuida do Content-Type a partir do StreamableFile.
    return new StreamableFile(Buffer.from(registro.foto), {
      type: registro.fotoTipo ?? 'image/jpeg',
    });
  }
}
