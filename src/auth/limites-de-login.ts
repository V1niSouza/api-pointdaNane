// As duas travas do login, e o motivo de serem duas.
//
// POR E-MAIL (a apertada): e a que barra o ataque de verdade. Quem tenta
// adivinhar a senha da dona bate sempre no mesmo e-mail, entao 5 erros ja
// travam. Trocar de IP nao adianta nada.
//
// POR IP (a folgada): cada tentativa custa um bcrypt, que e lento de
// proposito. Sem esta, alguem poderia derrubar a API sozinho mandando
// e-mails inventados sem parar. E folgada para nunca atrapalhar quem so
// errou a senha algumas vezes.
//
// As duas so contam ERRO, e o login certo zera as duas.

import { LimiteDeTentativas } from '../common/limite-de-tentativas.js';

export const LIMITE_POR_EMAIL = Symbol('LIMITE_POR_EMAIL');
export const LIMITE_POR_IP = Symbol('LIMITE_POR_IP');

const QUINZE_MINUTOS = 15 * 60 * 1000;

export const provedoresDeLimite = [
  {
    provide: LIMITE_POR_EMAIL,
    useFactory: () => new LimiteDeTentativas({ maximo: 5, janelaMs: QUINZE_MINUTOS }),
  },
  {
    provide: LIMITE_POR_IP,
    useFactory: () => new LimiteDeTentativas({ maximo: 30, janelaMs: QUINZE_MINUTOS }),
  },
];
