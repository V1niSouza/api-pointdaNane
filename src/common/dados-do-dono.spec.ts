import { describe, expect, it } from 'vitest';
import { conferirDadosDoDono } from './dados-do-dono';

const COMPLETO = {
  RESTAURANTE_NOME: 'Point da Nane',
  RESTAURANTE_WHATSAPP: '5511999998888',
  DONO_EMAIL: 'dono@exemplo.com',
  DONO_SENHA: 'senhaboa123',
};

describe('conferirDadosDoDono', () => {
  it('aceita um conjunto completo e nao reclama de nada', () => {
    expect(conferirDadosDoDono(COMPLETO).erros).toEqual([]);
  });

  it('devolve o e-mail em minusculas e sem espacos sobrando', () => {
    const { dados } = conferirDadosDoDono({ ...COMPLETO, DONO_EMAIL: '  Dono@Exemplo.COM ' });
    expect(dados?.email).toBe('dono@exemplo.com');
  });

  it('aceita o whatsapp escrito com mascara e guarda so os digitos', () => {
    const { dados } = conferirDadosDoDono({ ...COMPLETO, RESTAURANTE_WHATSAPP: '+55 (11) 99999-8888' });
    expect(dados?.whatsapp).toBe('5511999998888');
  });

  it('junta TODOS os problemas de uma vez, para nao corrigir um por rodada', () => {
    const { erros } = conferirDadosDoDono({});
    expect(erros.length).toBe(4);
  });

  it('nao devolve dados nenhum quando ha problema', () => {
    expect(conferirDadosDoDono({}).dados).toBeNull();
  });

  it('recusa a senha pela MESMA regra do login', () => {
    const { erros } = conferirDadosDoDono({ ...COMPLETO, DONO_SENHA: 'sete123' });
    expect(erros.join(' ')).toContain('8');
  });

  it('recusa um whatsapp curto demais para ter DDI e DDD', () => {
    const { erros } = conferirDadosDoDono({ ...COMPLETO, RESTAURANTE_WHATSAPP: '999998888' });
    expect(erros.join(' ')).toContain('WhatsApp');
  });

  it('recusa um e-mail sem cara de e-mail', () => {
    const { erros } = conferirDadosDoDono({ ...COMPLETO, DONO_EMAIL: 'nane' });
    expect(erros.join(' ')).toContain('e-mail');
  });

  it('recusa nome do restaurante em branco', () => {
    const { erros } = conferirDadosDoDono({ ...COMPLETO, RESTAURANTE_NOME: '   ' });
    expect(erros.join(' ')).toContain('nome');
  });
});
