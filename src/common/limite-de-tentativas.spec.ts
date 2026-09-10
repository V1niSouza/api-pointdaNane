import { describe, expect, it } from 'vitest';
import { LimiteDeTentativas, descreverEspera } from './limite-de-tentativas';

// O relogio entra como parametro (o mesmo jeito de common/horario.ts), entao
// o teste anda no tempo sem precisar esperar de verdade.
const JANELA = 15 * 60 * 1000; // 15 minutos
const novo = () => new LimiteDeTentativas({ maximo: 3, janelaMs: JANELA });

describe('LimiteDeTentativas', () => {
  it('nao bloqueia quem ainda nao errou nada', () => {
    expect(novo().esperaEmSegundos('nane', 0)).toBeNull();
  });

  it('nao bloqueia enquanto esta abaixo do maximo', () => {
    const limite = novo();
    limite.registrarFalha('nane', 0);
    limite.registrarFalha('nane', 1000);
    expect(limite.esperaEmSegundos('nane', 2000)).toBeNull();
  });

  it('bloqueia ao chegar no maximo de falhas', () => {
    const limite = novo();
    for (let i = 0; i < 3; i++) limite.registrarFalha('nane', i * 1000);
    expect(limite.esperaEmSegundos('nane', 3000)).toBeGreaterThan(0);
  });

  it('diz quantos segundos faltam, contados da falha mais antiga', () => {
    const limite = novo();
    for (let i = 0; i < 3; i++) limite.registrarFalha('nane', 0);
    // Passou 1 minuto dos 15: faltam 14.
    expect(limite.esperaEmSegundos('nane', 60_000)).toBe(14 * 60);
  });

  it('libera sozinho depois que a janela passa', () => {
    const limite = novo();
    for (let i = 0; i < 3; i++) limite.registrarFalha('nane', 0);
    expect(limite.esperaEmSegundos('nane', JANELA + 1)).toBeNull();
  });

  it('esquece as falhas velhas: erros espalhados no tempo nao somam', () => {
    const limite = novo();
    limite.registrarFalha('nane', 0);
    limite.registrarFalha('nane', JANELA + 1);
    limite.registrarFalha('nane', JANELA + 2);
    // A primeira ja saiu da janela, entao valem duas — abaixo do maximo.
    expect(limite.esperaEmSegundos('nane', JANELA + 3)).toBeNull();
  });

  it('limpar zera o contador, que e o que o login certo faz', () => {
    const limite = novo();
    for (let i = 0; i < 3; i++) limite.registrarFalha('nane', 0);
    limite.limpar('nane');
    expect(limite.esperaEmSegundos('nane', 0)).toBeNull();
  });

  it('conta cada chave separado: bloquear um e-mail nao bloqueia o outro', () => {
    const limite = novo();
    for (let i = 0; i < 3; i++) limite.registrarFalha('nane', 0);
    expect(limite.esperaEmSegundos('outro', 0)).toBeNull();
  });
});

describe('descreverEspera', () => {
  it('fala em segundos quando falta menos de um minuto', () => {
    expect(descreverEspera(30)).toBe('30 segundos');
  });

  it('fala em minutos quando falta mais que isso, arredondando para cima', () => {
    expect(descreverEspera(61)).toBe('2 minutos');
  });

  it('usa o singular quando e um minuto so', () => {
    expect(descreverEspera(60)).toBe('1 minuto');
  });

  it('usa o singular quando e um segundo so', () => {
    expect(descreverEspera(1)).toBe('1 segundo');
  });
});
