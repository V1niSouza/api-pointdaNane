// Contador de tentativas fracassadas, para travar ataque de forca bruta.
//
// COMO FUNCIONA: guarda o horario de cada falha de uma "chave" (o e-mail
// tentado, ou o IP de quem tentou). Ao chegar em `maximo` falhas dentro de
// `janelaMs`, a chave fica bloqueada ate a falha mais antiga envelhecer.
//
// SO CONTA FALHA. Um login certo chama `limpar` e zera tudo — quem sabe a
// senha nunca e barrado, e a bateria de testes pode rodar quantas vezes for.
//
// LIMITE CONHECIDO: a contagem vive na memoria do processo. Reiniciar a API
// zera, e duas instancias nao compartilham. Serve para o cenario deste
// projeto (uma instancia na Render). Se um dia forem varias, isto vira Redis
// sem mudar quem chama.

export interface RegraDeLimite {
  /** Quantas falhas dentro da janela ja bloqueiam. */
  maximo: number;
  /** O tamanho da janela, em milissegundos. */
  janelaMs: number;
}

export class LimiteDeTentativas {
  private readonly falhas = new Map<string, number[]>();

  constructor(private readonly regra: RegraDeLimite) {}

  /** Anota mais uma falha desta chave. */
  registrarFalha(chave: string, agora: number): void {
    const recentes = this.recentes(chave, agora);
    recentes.push(agora);
    this.falhas.set(chave, recentes);
  }

  /**
   * Quantos segundos faltam ate a chave poder tentar de novo,
   * ou null quando ela nao esta bloqueada.
   */
  esperaEmSegundos(chave: string, agora: number): number | null {
    const recentes = this.recentes(chave, agora);
    if (recentes.length < this.regra.maximo) return null;

    // A trava cai quando a falha mais antiga sair da janela.
    const liberaEm = recentes[0] + this.regra.janelaMs;
    return Math.ceil((liberaEm - agora) / 1000);
  }

  /** Esquece as falhas desta chave (o que o login certo faz). */
  limpar(chave: string): void {
    this.falhas.delete(chave);
  }

  /** As falhas que ainda estao dentro da janela; as velhas sao descartadas. */
  private recentes(chave: string, agora: number): number[] {
    const inicioDaJanela = agora - this.regra.janelaMs;
    const guardadas = this.falhas.get(chave) ?? [];
    return guardadas.filter((quando) => quando > inicioDaJanela);
  }
}

/** Transforma a espera em texto para a mensagem que a pessoa le. */
export function descreverEspera(segundos: number): string {
  if (segundos < 60) {
    return `${segundos} ${segundos === 1 ? 'segundo' : 'segundos'}`;
  }

  const minutos = Math.ceil(segundos / 60);
  return `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
}
