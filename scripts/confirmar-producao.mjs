// Trava dos comandos destrutivos.
//
// Agora existe um .env so, e ele aponta para o Supabase de PRODUCAO. Tres
// comandos deste projeto destroem dados por natureza:
//
//   db:seed      apaga o restaurante — e em cascata itens, promocoes,
//                bairros e o proprio dono — antes de repovoar com exemplos
//   db:reset     derruba o esquema inteiro e reaplica do zero
//   testar:api   cria e apaga itens, promocoes e bairros a cada rodada
//
// Com o cardapio real no banco, qualquer um dos tres apaga o trabalho da
// Nane, e o plano gratuito do Supabase nao tem backup para desfazer.
//
// Esta trava nao impede nada: ela exige um gesto deliberado.
//
//   PERMITIR_PRODUCAO=1 pnpm db:seed
//
// Bancos em localhost passam direto, sem exigir nada.

import 'dotenv/config';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL nao definida. Confira o .env.');
  process.exit(1);
}

const { hostname } = new URL(url);
const ehLocal = ['localhost', '127.0.0.1', '::1'].includes(hostname);

if (ehLocal || process.env.PERMITIR_PRODUCAO === '1') {
  process.exit(0);
}

console.error(`
  ┌──────────────────────────────────────────────────────────────┐
  │  PAREI: este comando APAGA DADOS, e o banco e de producao.   │
  └──────────────────────────────────────────────────────────────┘

  banco: ${hostname}

  Se e isso mesmo que voce quer, repita com a confirmacao na frente:

      PERMITIR_PRODUCAO=1 <o comando que voce rodou>

  Lembre que o plano gratuito do Supabase nao guarda backup.
`);
process.exit(1);
