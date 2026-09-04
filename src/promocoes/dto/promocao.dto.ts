import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const TIPOS_PROMOCAO = ['desconto_item', 'combo_autonomo'] as const;
export type TipoPromocaoDto = (typeof TIPOS_PROMOCAO)[number];

const limpar = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export class CriarPromocaoDto {
  @IsIn(TIPOS_PROMOCAO, {
    message: 'O tipo deve ser "desconto_item" ou "combo_autonomo".',
  })
  tipo!: TipoPromocaoDto;

  /** Texto que aparece no card. Obrigatorio nos dois tipos. */
  @IsString()
  @MinLength(2, { message: 'Informe o selo da promocao.' })
  @MaxLength(80)
  @limpar()
  selo!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'O preco promocional deve ser maior que zero.' })
  @Max(99999.99)
  precoPromocional!: number;

  /** So no tipo desconto_item. Validado no service. */
  @IsOptional()
  @IsUUID('4', { message: 'Selecione um item valido do cardapio.' })
  itemCardapioId?: string;

  /** So no tipo combo_autonomo. Validado no service. */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @limpar()
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @limpar()
  descricao?: string | null;

  /** O preco riscado. No desconto_item, se omitido, usa o preco do item. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99999.99)
  precoCheio?: number;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}

export class AtualizarPromocaoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @limpar()
  selo?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99999.99)
  precoPromocional?: number;

  @IsOptional()
  @IsUUID('4')
  itemCardapioId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @limpar()
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @limpar()
  descricao?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99999.99)
  precoCheio?: number;

  /** O interruptor de ligar/desligar a promocao. */
  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}

export class ListarPromocoesDto {
  /** ?ativa=true lista so as ligadas; ?ativa=false so as pausadas. */
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  ativa?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number = 6;
}
