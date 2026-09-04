// "DTO" = a descricao do que a requisicao precisa mandar.
// O NestJS confere isto automaticamente e devolve erro 400 se vier errado,
// antes de o codigo rodar.

import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Informe um e-mail valido.' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  senha!: string;
}
