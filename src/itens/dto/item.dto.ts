import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Tira espacos sobrando dos textos que chegam. */
const limpar = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export class CriarItemDto {
  @IsString()
  @MinLength(2, { message: 'O nome do item deve ter pelo menos 2 caracteres.' })
  @MaxLength(120)
  @limpar()
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @limpar()
  descricao?: string | null;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'O preco deve ter no maximo 2 casas decimais.' })
  @IsPositive({ message: 'O preco deve ser maior que zero.' })
  @Max(99999.99)
  preco!: number;

  @IsString()
  @MinLength(2, { message: 'Informe a categoria do item.' })
  @MaxLength(60)
  @limpar()
  categoria!: string;

  @IsOptional()
  @IsBoolean()
  maisPedido?: boolean;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

/** Na edicao todos os campos sao opcionais: manda-se so o que mudou. */
export class AtualizarItemDto {
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
  preco?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @limpar()
  categoria?: string;

  @IsOptional()
  @IsBoolean()
  maisPedido?: boolean;

  /** E por aqui que o interruptor de ligar/desligar o item funciona. */
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

/** Filtros da listagem administrativa (?categoria=&busca=&pagina=&limite=). */
export class ListarItensDto {
  @IsOptional()
  @IsString()
  @limpar()
  categoria?: string;

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
  limite?: number = 6; // o design do painel mostra 6 itens por pagina
}

/** O corpo do envio de foto: a imagem em base64 e o formato dela. */
export class EnviarFotoDto {
  @IsString()
  @MaxLength(1_400_000, { message: 'A imagem e muito grande.' })
  dados!: string;

  @IsString()
  tipo!: string;
}
