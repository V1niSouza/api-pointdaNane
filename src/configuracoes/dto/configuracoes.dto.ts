import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { AVISO_WHATSAPP, FORMATO_WHATSAPP, somenteDigitos } from '../../common/whatsapp.js';

/** Formas de pagamento que o painel oferece. */
export const FORMAS_PAGAMENTO = [
  'pix',
  'dinheiro',
  'credito',
  'debito',
  'vale_refeicao',
] as const;

export const MODOS_TAXA = ['unica', 'por_bairro'] as const;
export type ModoTaxaDto = (typeof MODOS_TAXA)[number];

const limpar = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export class AtualizarConfiguracoesDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @limpar()
  nome?: string;

  /**
   * Numero que recebe os pedidos no WhatsApp. Guardamos so digitos, com o
   * codigo do pais, porque e assim que o link wa.me exige.
   * Ex.: 5511999998888
   */
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? somenteDigitos(value) : value))
  @Matches(FORMATO_WHATSAPP, { message: AVISO_WHATSAPP })
  whatsapp?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'O horario de abertura deve estar no formato HH:MM. Ex.: 18:00',
  })
  horarioAbertura?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'O horario de fechamento deve estar no formato HH:MM. Ex.: 23:30',
  })
  horarioFechamento?: string;

  /** A chave de "abrir/fechar a loja agora" do painel. */
  @IsOptional()
  @IsBoolean()
  abertoManual?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Habilite pelo menos uma forma de pagamento.' })
  @ArrayUnique({ message: 'Nao repita a mesma forma de pagamento.' })
  @IsIn(FORMAS_PAGAMENTO, {
    each: true,
    message: `Forma de pagamento invalida. Use: ${FORMAS_PAGAMENTO.join(', ')}.`,
  })
  formasPagamento?: string[];

  @IsOptional()
  @IsIn(MODOS_TAXA, { message: 'O modo de cobranca deve ser "unica" ou "por_bairro".' })
  modoTaxaEntrega?: ModoTaxaDto;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999.99)
  taxaEntregaUnica?: number | null;
}
