// Monta o endereco da foto que a API devolve nas respostas.
//
// E um CAMINHO, e nao um endereco completo: o front sabe onde a API mora
// (NEXT_PUBLIC_API_URL) e junta os dois. Assim a API nao precisa saber por
// qual dominio esta sendo acessada — o que muda entre o local, a rede de casa
// e a producao, e seria mais uma coisa para configurar errado.
//
// O ?v= carrega o momento da ultima alteracao. E ele que torna seguro pedir
// ao navegador para guardar a imagem por um ano: trocar a foto muda o
// endereco, e o navegador busca a nova sozinho, sem ninguem limpar cache.
//
// Devolve null quando nao ha foto: o front mostra o espaco reservado.

function caminho(recurso: string, id: string, temFoto: boolean, versao: Date): string | null {
  return temFoto ? `/${recurso}/${id}/foto?v=${versao.getTime()}` : null;
}

export function caminhoDaFotoDoItem(id: string, temFoto: boolean, versao: Date): string | null {
  return caminho('itens', id, temFoto, versao);
}

export function caminhoDaFotoDaPromocao(id: string, temFoto: boolean, versao: Date): string | null {
  return caminho('promocoes', id, temFoto, versao);
}
