// Conferencia dos dados que criam a lanchonete e o dono no banco de verdade.
//
// Existe separado do comando que grava para poder ser testado sem banco: o
// comando so junta as pecas. As regras sao AS MESMAS do resto da API — senha
// de common/senha.ts, numero de common/whatsapp.ts — porque um dono criado
// com dados que a API depois recusa e a pior armadilha possivel: a Nane fica
// trancada para fora sem ninguem entender o porque.

import { problemaNaSenha } from './senha.js';
import { AVISO_WHATSAPP, FORMATO_WHATSAPP, somenteDigitos } from './whatsapp.js';

/** Formato minimo de e-mail: algo@algo.algo, sem espacos. */
const FORMATO_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface DadosDoDono {
  restauranteNome: string;
  whatsapp: string;
  email: string;
  senha: string;
}

export interface DonoConferido {
  /** Vazio quando esta tudo certo. */
  erros: string[];
  /** Ja normalizado; null quando ha qualquer problema. */
  dados: DadosDoDono | null;
}

type Entrada = Partial<
  Record<'RESTAURANTE_NOME' | 'RESTAURANTE_WHATSAPP' | 'DONO_EMAIL' | 'DONO_SENHA', string>
>;

export function conferirDadosDoDono(entrada: Entrada): DonoConferido {
  const erros: string[] = [];

  const restauranteNome = (entrada.RESTAURANTE_NOME ?? '').trim();
  if (!restauranteNome) {
    erros.push('RESTAURANTE_NOME: informe o nome da lanchonete.');
  }

  const whatsapp = somenteDigitos(entrada.RESTAURANTE_WHATSAPP ?? '');
  if (!FORMATO_WHATSAPP.test(whatsapp)) {
    erros.push(`RESTAURANTE_WHATSAPP: ${AVISO_WHATSAPP}`);
  }

  const email = (entrada.DONO_EMAIL ?? '').trim().toLowerCase();
  if (!FORMATO_DE_EMAIL.test(email)) {
    erros.push('DONO_EMAIL: informe um e-mail valido.');
  }

  const senha = entrada.DONO_SENHA ?? '';
  const problema = problemaNaSenha(senha);
  if (problema) {
    erros.push(`DONO_SENHA: ${problema}`);
  }

  // Tudo ou nada: com um campo torto, nao devolvemos dados pela metade que
  // alguem possa gravar sem querer.
  return {
    erros,
    dados: erros.length > 0 ? null : { restauranteNome, whatsapp, email, senha },
  };
}
