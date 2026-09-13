// "Seed" = semente. Este arquivo enche o banco vazio com dados de exemplo,
// para o front ter cardapio, promocoes e bairros para exibir enquanto
// construimos as telas.
//
// Rode com:  pnpm db:seed
//
// O seed NAO cria o login do dono: senha fixa no codigo vira senha publica
// quando o repositorio e aberto. Depois do seed, crie o dono com
// `pnpm criar-dono` (DONO_EMAIL e DONO_SENHA no .env).
// Ele pode ser rodado varias vezes sem duplicar nada: apaga o restaurante
// de exemplo antes de criar tudo de novo.

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log('Limpando dados de exemplo antigos...');
  // Apagar o restaurante derruba em cascata itens, promocoes, tarifas e dono.
  await prisma.restaurante.deleteMany({ where: { nome: 'Point da Nane' } });

  console.log('Criando o restaurante...');
  const restaurante = await prisma.restaurante.create({
    data: {
      nome: 'Point da Nane',
      whatsapp: '5511999998888', // numero ficticio: DDI 55 + DDD 11 + numero
      horarioAbertura: '18:00',
      horarioFechamento: '23:30',
      abertoManual: true,
      formasPagamento: ['pix', 'dinheiro', 'credito', 'debito'],
      modoTaxaEntrega: 'por_bairro',
      taxaEntregaUnica: null,
    },
  });

  console.log('Criando os itens do cardapio...');
  const itens = [
    // Lanches
    { nome: 'X-Tudo da Nane', descricao: 'Pão brioche, dois hambúrgueres, queijo, bacon, ovo, alface, tomate e maionese da casa.', preco: '34.90', categoria: 'Lanches', maisPedido: true },
    { nome: 'X-Salada', descricao: 'Pão brioche, hambúrguer, queijo, alface, tomate e maionese.', preco: '24.90', categoria: 'Lanches', maisPedido: false },
    { nome: 'X-Bacon', descricao: 'Pão brioche, hambúrguer, queijo cheddar e bacon crocante.', preco: '28.90', categoria: 'Lanches', maisPedido: true },
    { nome: 'X-Frango', descricao: 'Pão brioche, filé de frango grelhado, queijo, alface e tomate.', preco: '27.90', categoria: 'Lanches', maisPedido: false },
    { nome: 'X-Egg', descricao: 'Pão brioche, hambúrguer, queijo e ovo frito.', preco: '25.90', categoria: 'Lanches', maisPedido: false },
    { nome: 'Vegetariano', descricao: 'Pão brioche, hambúrguer de grão-de-bico, queijo, rúcula e tomate seco.', preco: '29.90', categoria: 'Lanches', maisPedido: false },

    // Porções
    { nome: 'Batata Frita', descricao: 'Porção de batata frita crocante. Serve 2 pessoas.', preco: '22.00', categoria: 'Porções', maisPedido: true },
    { nome: 'Batata com Cheddar e Bacon', descricao: 'Batata frita coberta com cheddar cremoso e bacon.', preco: '32.00', categoria: 'Porções', maisPedido: false },
    { nome: 'Onion Rings', descricao: 'Anéis de cebola empanados. 10 unidades.', preco: '24.00', categoria: 'Porções', maisPedido: false },
    { nome: 'Nuggets', descricao: 'Nuggets de frango crocantes. 12 unidades.', preco: '20.00', categoria: 'Porções', maisPedido: false },

    // Bebidas
    { nome: 'Coca-Cola Lata 350ml', descricao: null, preco: '7.00', categoria: 'Bebidas', maisPedido: false },
    { nome: 'Guaraná Antarctica Lata 350ml', descricao: null, preco: '6.50', categoria: 'Bebidas', maisPedido: false },
    { nome: 'Suco de Laranja 500ml', descricao: 'Natural, feito na hora.', preco: '12.00', categoria: 'Bebidas', maisPedido: false },
    { nome: 'Água Mineral 500ml', descricao: null, preco: '4.00', categoria: 'Bebidas', maisPedido: false },
    { nome: 'Milk Shake de Chocolate 400ml', descricao: 'Sorvete cremoso batido com calda de chocolate.', preco: '18.00', categoria: 'Bebidas', maisPedido: true },

    // Sobremesas
    { nome: 'Petit Gateau', descricao: 'Bolo quente de chocolate com sorvete de creme.', preco: '19.90', categoria: 'Sobremesas', maisPedido: false },
    { nome: 'Pudim de Leite', descricao: 'Fatia generosa de pudim caseiro.', preco: '12.00', categoria: 'Sobremesas', maisPedido: false },

    // Um item desligado, para testarmos que ele NÃO aparece para o cliente
    { nome: 'X-Costela (fora do cardápio)', descricao: 'Item desativado, usado só para teste.', preco: '38.00', categoria: 'Lanches', maisPedido: false, ativo: false },
  ];

  // O Postgres carimba o mesmo horario em todas as linhas inseridas de uma
  // vez so. Como a ordem das categorias no cardapio segue a ordem de
  // cadastro, damos a cada item um horario proprio, um segundo apos o outro.
  const inicio = Date.now();
  await prisma.itemCardapio.createMany({
    data: itens.map((item, indice) => ({
      ...item,
      restauranteId: restaurante.id,
      criadoEm: new Date(inicio + indice * 1000),
    })),
  });

  console.log('Criando as promocoes...');
  const xTudo = await prisma.itemCardapio.findFirstOrThrow({
    where: { restauranteId: restaurante.id, nome: 'X-Tudo da Nane' },
  });

  await prisma.promocao.createMany({
    data: [
      {
        // Tipo 1: desconto em um item que ja existe no cardapio.
        restauranteId: restaurante.id,
        tipo: 'desconto_item',
        itemCardapioId: xTudo.id,
        selo: 'Terça do X-Tudo',
        precoPromocional: '27.90',
        precoCheio: '34.90', // vira o preco riscado no card
        ativa: true,
      },
      {
        // Tipo 2: combo que nao aponta para nenhum item, tem nome proprio.
        restauranteId: restaurante.id,
        tipo: 'combo_autonomo',
        nome: 'Combo Casal',
        descricao: '2 X-Salada + 1 porção de batata frita + 2 refrigerantes lata.',
        selo: 'Combo Casal',
        precoPromocional: '79.90',
        precoCheio: '97.80',
        ativa: true,
      },
      {
        // Uma promocao pausada, para a tela do dono ter os dois estados.
        restauranteId: restaurante.id,
        tipo: 'desconto_item',
        itemCardapioId: xTudo.id,
        selo: 'Promo antiga (pausada)',
        precoPromocional: '29.90',
        precoCheio: '34.90',
        ativa: false,
      },
    ],
  });

  console.log('Criando as taxas por bairro...');
  await prisma.tarifaBairro.createMany({
    data: [
      { restauranteId: restaurante.id, bairro: 'Centro', valorTaxa: '5.00' },
      { restauranteId: restaurante.id, bairro: 'Jardim América', valorTaxa: '7.00' },
      { restauranteId: restaurante.id, bairro: 'Vila Nova', valorTaxa: '8.50' },
      { restauranteId: restaurante.id, bairro: 'Santa Rita', valorTaxa: '10.00' },
      { restauranteId: restaurante.id, bairro: 'Parque das Flores', valorTaxa: '12.00' },
      { restauranteId: restaurante.id, bairro: 'Bela Vista', valorTaxa: '9.00' },
      { restauranteId: restaurante.id, bairro: 'São Jorge', valorTaxa: '11.50' },
    ],
  });

  console.log('');
  console.log('Pronto! Banco populado.');
  console.log(`  Restaurante ...: ${restaurante.nome} (id ${restaurante.id})`);
  console.log('  Login do dono .: nenhum — rode `pnpm criar-dono`');
}

main()
  .catch((erro) => {
    console.error('Falhou ao popular o banco:', erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
