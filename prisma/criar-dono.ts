// Cria (ou atualiza) a lanchonete e o login do dono no banco de VERDADE.
//
// E o irmao serio do seed: o seed enche o banco de exemplos para o
// desenvolvimento; este aqui cria uma linha de cada, com dados reais, e nao
// inventa cardapio nenhum — quem cadastra o cardapio e a Nane, pelo painel.
//
// A SENHA NUNCA MORA NO CODIGO. Ela vem do ambiente, e a forma segura de
// entregar e escrevendo no .env.producao (que esta fora do Git):
//
//   RESTAURANTE_NOME=Point da Nane
//   RESTAURANTE_WHATSAPP=5511999998888
//   DONO_EMAIL=nane@exemplo.com.br
//   DONO_SENHA=<a senha de verdade>
//
// e entao:  pnpm producao:criar-dono
//
// Passar pela linha de comando tambem funciona, mas deixa a senha no
// historico do terminal — por isso o arquivo e o caminho recomendado.

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { conferirDadosDoDono } from '../src/common/dados-do-dono.js';

const { erros, dados } = conferirDadosDoDono({
  RESTAURANTE_NOME: process.env.RESTAURANTE_NOME,
  RESTAURANTE_WHATSAPP: process.env.RESTAURANTE_WHATSAPP,
  DONO_EMAIL: process.env.DONO_EMAIL,
  DONO_SENHA: process.env.DONO_SENHA,
});

if (!dados) {
  console.error('\nNao consegui criar o dono. Corrija e rode de novo:\n');
  for (const erro of erros) console.error(`  - ${erro}`);
  console.error('');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }),
});

async function main() {
  if (!dados) return; // o TypeScript nao enxerga o process.exit acima

  // Neste MVP existe uma lanchonete so. Se ja houver uma, ela e reaproveitada
  // e NAO e sobrescrita: nome e WhatsApp sao coisas que a Nane edita pelo
  // painel, e este comando nao pode desfazer o que ela mudou por la.
  const existente = await prisma.restaurante.findFirst({ orderBy: { criadoEm: 'asc' } });

  const restaurante =
    existente ??
    (await prisma.restaurante.create({
      data: {
        nome: dados.restauranteNome,
        whatsapp: dados.whatsapp,
        // Valores de partida; a Nane ajusta tudo isso no painel.
        horarioAbertura: '18:00',
        horarioFechamento: '23:30',
        abertoManual: false, // nasce FECHADA: ninguem pede antes de o cardapio existir
        formasPagamento: ['pix', 'dinheiro'],
        modoTaxaEntrega: 'por_bairro',
        taxaEntregaUnica: null,
      },
    }));

  console.log(existente ? 'Lanchonete ja existia, reaproveitada.' : 'Lanchonete criada.');
  console.log(`  nome: ${restaurante.nome}`);

  const senhaHash = await bcrypt.hash(dados.senha, 10);

  // Se o e-mail ja existe, trocamos a senha. E a valvula de escape para
  // quando alguem perder a senha — hoje a unica, ate a tela de troca existir.
  const jaExistia = await prisma.dono.findUnique({ where: { email: dados.email } });

  await prisma.dono.upsert({
    where: { email: dados.email },
    update: { senhaHash },
    create: { restauranteId: restaurante.id, email: dados.email, senhaHash },
  });

  console.log(jaExistia ? 'Dono ja existia: SENHA ATUALIZADA.' : 'Dono criado.');
  console.log(`  e-mail: ${dados.email}`);
  console.log('  senha: (nao aparece aqui, de proposito)');
}

main()
  .catch((erro: unknown) => {
    console.error('Falhou:', erro instanceof Error ? erro.message : erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
