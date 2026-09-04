import { describe, expect, it } from 'vitest';
import { origensPermitidas } from './cors';

describe('origensPermitidas', () => {
  it('aceita uma origem so', () => {
    expect(origensPermitidas('http://localhost:3000')).toEqual([
      'http://localhost:3000',
    ]);
  });

  it('aceita varias separadas por virgula, para testar no celular pela rede', () => {
    expect(
      origensPermitidas('http://localhost:3000,http://192.168.5.12:3000'),
    ).toEqual(['http://localhost:3000', 'http://192.168.5.12:3000']);
  });

  it('ignora espacos e itens vazios da lista', () => {
    expect(origensPermitidas(' http://localhost:3000 , ,')).toEqual([
      'http://localhost:3000',
    ]);
  });

  it('cai no front local quando a variavel nao existe', () => {
    expect(origensPermitidas(undefined)).toEqual(['http://localhost:3000']);
  });
});
