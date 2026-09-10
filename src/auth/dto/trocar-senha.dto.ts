// O que a troca de senha precisa receber.
//
// A senha ATUAL nao passa pela regra de tamanho de proposito: ela ja existe,
// e uma senha antiga mais curta ainda precisa poder ser usada para trocar.
// Quem aplica a regra e a senha NOVA.

import { IsNotEmpty, IsString, Validate } from 'class-validator';
import { SenhaAceitavel } from './senha-aceitavel.validator.js';

export class TrocarSenhaDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe a senha atual.' })
  senhaAtual!: string;

  @IsString()
  @Validate(SenhaAceitavel)
  senhaNova!: string;
}
