import { describe, expect, it } from 'vitest';
import { exigeBairrosCadastrados } from './modo-de-entrega';

describe('exigeBairrosCadastrados', () => {
  // A regra existe para impedir que o dono ESCOLHA um modo que ainda nao
  // funciona. Ela nao pode virar uma tranca em tudo o mais.
  it('exige quando o dono esta escolhendo o modo por bairro', () => {
    expect(exigeBairrosCadastrados('por_bairro')).toBe(true);
  });

  it('nao exige quando o dono esta escolhendo taxa unica', () => {
    expect(exigeBairrosCadastrados('unica')).toBe(false);
  });

  // ESTE E O CASO QUE QUEBROU: fechar a loja nao manda modo nenhum. Antes,
  // a regra era conferida contra o modo RESULTANTE, entao uma loja em
  // "por bairro" sem bairro nenhum ficava com TODAS as configuracoes
  // travadas — inclusive a chave de abrir e fechar, que nao tem relacao com
  // entrega.
  it('NAO exige quando o pedido nem fala de modo de entrega', () => {
    expect(exigeBairrosCadastrados(undefined)).toBe(false);
  });
});
