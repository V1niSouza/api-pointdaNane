// Liga a regra de senha (common/senha.ts) ao conferidor automatico dos DTOs.
//
// Existe para a regra NAO ser escrita de novo aqui: este arquivo so pergunta
// a ela. Assim, mudar o tamanho minimo num lugar so muda em todos.

import {
  type ValidationArguments,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { problemaNaSenha } from '../../common/senha.js';

@ValidatorConstraint({ name: 'senhaAceitavel' })
export class SenhaAceitavel implements ValidatorConstraintInterface {
  validate(valor: unknown): boolean {
    return typeof valor === 'string' && problemaNaSenha(valor) === null;
  }

  defaultMessage(argumentos: ValidationArguments): string {
    const valor: unknown = argumentos.value;
    if (typeof valor !== 'string') return 'Informe a senha.';
    return problemaNaSenha(valor) ?? 'Senha invalida.';
  }
}
