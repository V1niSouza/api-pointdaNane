import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const limpar = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export class CriarTarifaDto {
  @IsString()
  @MinLength(2, { message: 'Informe o nome do bairro.' })
  @MaxLength(120)
  @limpar()
  bairro!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'A taxa deve ter no maximo 2 casas decimais.' })
  @Min(0, { message: 'A taxa nao pode ser negativa.' }) // 0 = entrega gratis no bairro
  @Max(9999.99)
  valorTaxa!: number;
}

export class AtualizarTarifaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @limpar()
  bairro?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999.99)
  valorTaxa?: number;
}

export class ListarTarifasDto {
  @IsOptional()
  @IsString()
  @limpar()
  busca?: string;

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
  limite?: number = 5; // o design da tela de taxas mostra 5 bairros por pagina
}
