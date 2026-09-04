import { describe, expect, it } from 'vitest';
import {
  dentroDoHorario,
  horarioParaMinutos,
  lojaEstaAberta,
  minutosAgora,
} from './horario.js';

const HORAS = (h: number, m = 0) => h * 60 + m;

describe('horarioParaMinutos', () => {
  it('converte um horario comum', () => {
    expect(horarioParaMinutos('18:30')).toBe(HORAS(18, 30));
  });

  it('aceita meia-noite', () => {
    expect(horarioParaMinutos('00:00')).toBe(0);
  });

  it('recusa texto que nao e horario', () => {
    expect(() => horarioParaMinutos('abc')).toThrow();
    expect(() => horarioParaMinutos('25:00')).toThrow();
    expect(() => horarioParaMinutos('18:70')).toThrow();
  });
});

describe('dentroDoHorario - janela no mesmo dia (18:00 as 23:30)', () => {
  const abre = '18:00';
  const fecha = '23:30';

  it('esta fechado antes de abrir', () => {
    expect(dentroDoHorario(abre, fecha, HORAS(17, 59))).toBe(false);
  });

  it('abre exatamente no horario de abertura', () => {
    expect(dentroDoHorario(abre, fecha, HORAS(18, 0))).toBe(true);
  });

  it('esta aberto no meio do expediente', () => {
    expect(dentroDoHorario(abre, fecha, HORAS(21, 15))).toBe(true);
  });

  it('fecha exatamente no horario de fechamento', () => {
    expect(dentroDoHorario(abre, fecha, HORAS(23, 30))).toBe(false);
  });

  it('esta fechado de madrugada', () => {
    expect(dentroDoHorario(abre, fecha, HORAS(2, 0))).toBe(false);
  });
});

describe('dentroDoHorario - janela que atravessa a meia-noite (18:00 as 02:00)', () => {
  const abre = '18:00';
  const fecha = '02:00';

  it('esta fechado a tarde, antes de abrir', () => {
    expect(dentroDoHorario(abre, fecha, HORAS(17, 0))).toBe(false);
  });

  it('esta aberto a noite', () => {
    expect(dentroDoHorario(abre, fecha, HORAS(23, 0))).toBe(true);
  });

  it('continua aberto depois da meia-noite', () => {
    expect(dentroDoHorario(abre, fecha, HORAS(1, 30))).toBe(true);
  });

  it('fecha as 02:00', () => {
    expect(dentroDoHorario(abre, fecha, HORAS(2, 0))).toBe(false);
  });
});

describe('dentroDoHorario - 24 horas', () => {
  it('abertura igual ao fechamento significa sempre aberto', () => {
    expect(dentroDoHorario('00:00', '00:00', HORAS(3, 0))).toBe(true);
    expect(dentroDoHorario('12:00', '12:00', HORAS(23, 59))).toBe(true);
  });
});

describe('lojaEstaAberta', () => {
  it('a chave manual desligada fecha a loja mesmo dentro do horario', () => {
    expect(lojaEstaAberta(false, '18:00', '23:30', HORAS(20, 0))).toBe(false);
  });

  it('a chave manual ligada nao abre a loja fora do horario', () => {
    expect(lojaEstaAberta(true, '18:00', '23:30', HORAS(15, 0))).toBe(false);
  });

  it('so abre com a chave ligada e dentro do horario', () => {
    expect(lojaEstaAberta(true, '18:00', '23:30', HORAS(20, 0))).toBe(true);
  });
});

describe('minutosAgora', () => {
  it('le a hora no fuso informado', () => {
    // 2026-09-04T15:30:00Z = 12:30 em Sao Paulo (UTC-3)
    const instante = new Date('2026-09-04T15:30:00Z');
    expect(minutosAgora(instante, 'America/Sao_Paulo')).toBe(HORAS(12, 30));
  });

  it('devolve 0 na meia-noite, e nao 1440', () => {
    // 2026-09-04T03:00:00Z = 00:00 em Sao Paulo
    const instante = new Date('2026-09-04T03:00:00Z');
    expect(minutosAgora(instante, 'America/Sao_Paulo')).toBe(0);
  });
});
