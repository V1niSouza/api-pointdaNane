// "DTO" = a descricao do que a requisicao precisa mandar.
// O NestJS confere isto automaticamente e devolve erro 400 se vier errado,
// antes de o codigo rodar.

import { IsEmail, IsString, Validate } from 'class-validator';
import { SenhaAceitavel } from './senha-aceitavel.validator.js';

export class LoginDto {
  @IsEmail({}, { message: 'Informe um e-mail valido.' })
  email!: string;

  // A regra de tamanho mora em common/senha.ts, num lugar so, porque o
  // cadastro do dono (o seed) precisa obedecer a mesma.
  @IsString()
  @Validate(SenhaAceitavel)
  senha!: string;
}
