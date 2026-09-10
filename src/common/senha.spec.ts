import { describe, expect, it } from 'vitest';
import { TAMANHO_MINIMO_SENHA, problemaNaSenha } from './senha';

describe('problemaNaSenha', () => {
  it('aceita uma senha com exatamente o tamanho minimo', () => {
    expect(problemaNaSenha('a'.repeat(TAMANHO_MINIMO_SENHA))).toBeNull();
  });

  it('aceita uma senha mais longa que o minimo', () => {
    expect(problemaNaSenha('pointdanane123')).toBeNull();
  });

  it('recusa uma senha curta demais e diz o tamanho exigido', () => {
    const problema = problemaNaSenha('a'.repeat(TAMANHO_MINIMO_SENHA - 1));
    expect(problema).toContain(String(TAMANHO_MINIMO_SENHA));
  });

  it('recusa senha vazia', () => {
    expect(problemaNaSenha('')).not.toBeNull();
  });

  it('recusa uma senha feita so de espacos, por mais longa que seja', () => {
    expect(problemaNaSenha(' '.repeat(TAMANHO_MINIMO_SENHA + 4))).not.toBeNull();
  });

  it('deixa a senha ter espaco no meio, que e caractere legitimo', () => {
    expect(problemaNaSenha('nane do point')).toBeNull();
  });
});
