// A regra de tamanho da senha do dono.
//
// Mora aqui, e nao dentro do DTO de login, porque vale em DOIS lugares que
// nao se enxergam: a conferencia do login e o cadastro feito pelo seed. Se a
// regra fosse escrita duas vezes, um dia as duas iam divergir.

/** Minimo de caracteres exigido na senha do dono. */
export const TAMANHO_MINIMO_SENHA = 8;

/**
 * Diz o que ha de errado com a senha, ou null se ela serve.
 * A mensagem sai pronta para ser mostrada a pessoa, em portugues.
 */
export function problemaNaSenha(senha: string): string | null {
  if (senha.length < TAMANHO_MINIMO_SENHA) {
    return `A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
  }

  // Espaco no meio e caractere legitimo ("nane do point" serve), mas uma
  // senha feita SO de espacos passaria no tamanho sem ser senha nenhuma.
  if (senha.trim().length === 0) {
    return 'A senha nao pode ser so espacos.';
  }

  return null;
}
