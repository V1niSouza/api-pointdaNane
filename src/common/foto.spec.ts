import { describe, expect, it } from 'vitest';
import { conferirFoto, TAMANHO_MAXIMO } from './foto';

/** Um PNG de 1x1 pixel, o menor arquivo de imagem que existe. */
const PNG_MINIMO =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('conferirFoto', () => {
  it('aceita uma imagem valida', () => {
    const resultado = conferirFoto(PNG_MINIMO, 'image/png');

    expect(resultado.erro).toBeNull();
    expect(resultado.bytes).not.toBeNull();
  });

  it('aceita o prefixo que o navegador manda junto', () => {
    const comPrefixo = `data:image/png;base64,${PNG_MINIMO}`;

    expect(conferirFoto(comPrefixo, 'image/png').erro).toBeNull();
  });

  it('recusa formato que nao seja imagem conhecida', () => {
    expect(conferirFoto(PNG_MINIMO, 'image/gif').erro).not.toBeNull();
    expect(conferirFoto(PNG_MINIMO, 'application/pdf').erro).not.toBeNull();
    expect(conferirFoto(PNG_MINIMO, 'text/html').erro).not.toBeNull();
  });

  it('aceita os tres formatos que o navegador gera', () => {
    for (const tipo of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(conferirFoto(PNG_MINIMO, tipo).erro).toBeNull();
    }
  });

  it('recusa conteudo vazio', () => {
    expect(conferirFoto('', 'image/png').erro).not.toBeNull();
    expect(conferirFoto('   ', 'image/png').erro).not.toBeNull();
  });

  // O front ja reduz a imagem antes de mandar. Este limite e a rede de
  // seguranca contra quem chamar a API por fora.
  it('recusa imagem acima do limite', () => {
    const gigante = Buffer.alloc(TAMANHO_MAXIMO + 1).toString('base64');

    expect(conferirFoto(gigante, 'image/png').erro).toMatch(/grande/i);
  });

  it('aceita imagem exatamente no limite', () => {
    const noLimite = Buffer.alloc(TAMANHO_MAXIMO).toString('base64');

    expect(conferirFoto(noLimite, 'image/png').erro).toBeNull();
  });

  // Um base64 quebrado nao pode derrubar a API.
  it('recusa base64 invalido em vez de estourar', () => {
    expect(() => conferirFoto('!!!nao@e#base64$', 'image/png')).not.toThrow();
    expect(conferirFoto('!!!nao@e#base64$', 'image/png').erro).not.toBeNull();
  });
});
