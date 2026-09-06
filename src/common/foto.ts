// Conferencia da foto que chega do painel.
//
// A imagem viaja em base64 dentro do JSON, e nao como envio de arquivo
// (multipart). O motivo: o navegador ja reduz e comprime a foto antes de
// mandar, entao o que chega aqui e pequeno, e um JSON simples dispensa uma
// biblioteca de upload inteira no backend.
//
// Estas regras sao a REDE DE SEGURANCA: quem chamar a API por fora do painel
// nao passa por elas no navegador.

/** Os tres formatos que o navegador consegue gerar ao redimensionar. */
export const TIPOS_DE_FOTO = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** 600 KB depois de decodificado. O front entrega bem menos que isso. */
export const TAMANHO_MAXIMO = 600 * 1024;

export interface FotoConferida {
  erro: string | null;
  bytes: Buffer | null;
}

export function conferirFoto(dados: string, tipo: string): FotoConferida {
  if (!TIPOS_DE_FOTO.includes(tipo as (typeof TIPOS_DE_FOTO)[number])) {
    return {
      erro: `Formato nao aceito. Use JPEG, PNG ou WebP.`,
      bytes: null,
    };
  }

  // O navegador manda "data:image/png;base64,AAAA...". Aceitamos com e sem.
  const limpo = dados.replace(/^data:[^;]+;base64,/, '').trim();
  if (!limpo) return { erro: 'A imagem chegou vazia.', bytes: null };

  // O Buffer.from IGNORA caracteres invalidos em silencio, em vez de
  // reclamar: sem esta conferencia, um texto qualquer viraria "imagem" e
  // seria gravado no banco. Conferimos o formato ANTES de decodificar.
  if (!/^[A-Za-z0-9+/\s]*={0,2}$/.test(limpo)) {
    return { erro: 'Nao consegui ler a imagem.', bytes: null };
  }

  const bytes = Buffer.from(limpo, 'base64');
  if (bytes.length === 0) return { erro: 'Nao consegui ler a imagem.', bytes: null };

  if (bytes.length > TAMANHO_MAXIMO) {
    const mb = (TAMANHO_MAXIMO / 1024 / 1024).toFixed(1).replace('.', ',');
    return { erro: `A imagem e muito grande. O limite e ${mb} MB.`, bytes: null };
  }

  return { erro: null, bytes };
}
