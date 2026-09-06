// Quando exigir que exista pelo menos um bairro cadastrado.
//
// A regra existe para impedir que o dono ESCOLHA um modo de cobranca que
// ainda nao funciona — no modo por bairro, sem bairro nenhum, o cliente nao
// consegue fechar o pedido.
//
// Ela olha o que o pedido PEDE, e nao o estado que vai ficar valendo. A
// diferenca importa: uma loja ja em "por bairro" que ficou sem bairros (o
// dono apagou todos para recomecar) tinha TODAS as configuracoes travadas,
// inclusive a chave de abrir e fechar, que nao tem relacao nenhuma com
// entrega. Trancar o dono para fora do painel e pior do que deixar um estado
// incompleto que a propria tela de taxas ja avisa.

export function exigeBairrosCadastrados(modoPedido: string | undefined): boolean {
  return modoPedido === 'por_bairro';
}
