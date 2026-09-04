// Quais enderecos de front tem permissao de chamar esta API pelo navegador.
//
// E uma LISTA porque, no desenvolvimento, o mesmo front e aberto por dois
// enderecos diferentes: http://localhost:3000 no notebook e
// http://<ip-do-notebook>:3000 no celular, para conferir o visual num
// aparelho de verdade. Sem o segundo na lista, o navegador do celular bloqueia
// a chamada e a tela fica no esqueleto para sempre.

const PADRAO = 'http://localhost:3000';

/** Le a variavel CORS_ORIGIN (uma origem, ou varias separadas por virgula). */
export function origensPermitidas(valor: string | undefined): string[] {
  const lista = (valor ?? PADRAO)
    .split(',')
    .map((origem) => origem.trim())
    .filter(Boolean);

  return lista.length > 0 ? lista : [PADRAO];
}
