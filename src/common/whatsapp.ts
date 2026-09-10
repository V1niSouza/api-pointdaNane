// A regra do numero de WhatsApp, num lugar so.
//
// Guardamos SO DIGITOS, com o codigo do pais, porque e assim que o link
// wa.me exige — e e o link que leva o pedido para a lanchonete.

/** DDI + DDD + numero: 12 digitos (fixo) ou 13 (celular com o 9). */
export const FORMATO_WHATSAPP = /^\d{12,13}$/;

export const AVISO_WHATSAPP =
  'O WhatsApp deve ter 12 ou 13 digitos, incluindo o codigo do pais. Ex.: 5511999998888';

/** Joga fora mascara, espaco e sinal: "+55 (11) 99999-8888" vira digitos. */
export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}
