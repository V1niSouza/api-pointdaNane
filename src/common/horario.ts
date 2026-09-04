// Regra de horario de funcionamento.
//
// Esta e uma regra de negocio, entao vive aqui no back (NestJS), nunca no
// banco e nunca no navegador do cliente.

/** Fuso usado para saber "que horas sao agora" na lanchonete. */
export const FUSO_PADRAO = 'America/Sao_Paulo';

/**
 * Converte "18:30" no numero de minutos desde a meia-noite (1110).
 * Facilita comparar horarios sem se perder com datas.
 */
export function horarioParaMinutos(horario: string): number {
  const partes = /^(\d{1,2}):(\d{2})$/.exec(horario.trim());
  if (!partes) {
    throw new Error(`Horario invalido: "${horario}". Esperado o formato HH:MM.`);
  }

  const horas = Number(partes[1]);
  const minutos = Number(partes[2]);
  if (horas > 23 || minutos > 59) {
    throw new Error(`Horario invalido: "${horario}".`);
  }

  return horas * 60 + minutos;
}

/** Que horas sao agora, em minutos desde a meia-noite, no fuso da lanchonete. */
export function minutosAgora(agora: Date = new Date(), fuso: string = FUSO_PADRAO): number {
  const formatador = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fuso,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const partes = formatador.formatToParts(agora);
  const hora = Number(partes.find((p) => p.type === 'hour')?.value ?? '0');
  const minuto = Number(partes.find((p) => p.type === 'minute')?.value ?? '0');

  // Meia-noite as vezes vem como "24" em pt-BR; normalizamos para 0.
  return (hora % 24) * 60 + minuto;
}

/**
 * Diz se o horario informado cai dentro da janela de funcionamento.
 *
 * Trata o caso de a loja fechar depois da meia-noite (ex.: 18:00 as 02:00),
 * em que o horario de fechamento e "menor" que o de abertura.
 */
export function dentroDoHorario(
  horarioAbertura: string,
  horarioFechamento: string,
  minutosDoDia: number,
): boolean {
  const abertura = horarioParaMinutos(horarioAbertura);
  const fechamento = horarioParaMinutos(horarioFechamento);

  // Abertura igual ao fechamento significa aberto 24 horas.
  if (abertura === fechamento) return true;

  // Janela normal, dentro do mesmo dia (ex.: 18:00 -> 23:30).
  if (abertura < fechamento) {
    return minutosDoDia >= abertura && minutosDoDia < fechamento;
  }

  // Janela que atravessa a meia-noite (ex.: 18:00 -> 02:00).
  return minutosDoDia >= abertura || minutosDoDia < fechamento;
}

/**
 * Estado final que o cliente ve: so esta aberto se a chave manual do dono
 * estiver ligada E o relogio estiver dentro do horario.
 */
export function lojaEstaAberta(
  abertoManual: boolean,
  horarioAbertura: string,
  horarioFechamento: string,
  minutosDoDia: number = minutosAgora(),
): boolean {
  return abertoManual && dentroDoHorario(horarioAbertura, horarioFechamento, minutosDoDia);
}
