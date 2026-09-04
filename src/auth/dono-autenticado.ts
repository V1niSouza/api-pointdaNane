// O que vai dentro do "cracha" (JWT) que o dono recebe ao fazer login.
//
// O restauranteId viaja no proprio cracha e e usado para filtrar TUDO nas
// rotas protegidas. Assim um dono nunca consegue ler nem alterar dados de
// outra lanchonete, mesmo que mande o id de outra pessoa na URL.

export interface ConteudoDoToken {
  /** id do dono ("sub" e o nome padrao desse campo em JWT) */
  sub: string;
  email: string;
  restauranteId: string;
}

/** Os dados do dono logado, anexados a requisicao pelo porteiro (guard). */
export interface DonoAutenticado {
  id: string;
  email: string;
  restauranteId: string;
}

declare module 'express' {
  interface Request {
    dono?: DonoAutenticado;
  }
}
