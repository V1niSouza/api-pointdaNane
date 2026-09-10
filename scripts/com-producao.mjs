// Roda um comando com as variaveis do .env.producao carregadas.
//
// POR QUE ISTO EXISTE: o .env (Docker local) e o unico que carrega sozinho.
// Para falar com o banco de verdade e preciso escrever "producao" no comando,
// de proposito. Assim um `pnpm testar:api` distraido nunca cai no banco da
// Nane — ele so enxerga o Postgres do notebook.
//
// Uso:  node scripts/com-producao.mjs <comando> [argumentos...]

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { config } from 'dotenv';

const ARQUIVO = '.env.producao';

if (!existsSync(ARQUIVO)) {
  console.error(`Falta o arquivo ${ARQUIVO} na pasta da API.`);
  process.exit(1);
}

const { error } = config({ path: ARQUIVO, override: true, quiet: true });
if (error) {
  console.error(`Nao consegui ler o ${ARQUIVO}: ${error.message}`);
  process.exit(1);
}

for (const obrigatoria of ['DATABASE_URL', 'DIRECT_URL']) {
  if (!process.env[obrigatoria]) {
    console.error(`O ${ARQUIVO} nao define ${obrigatoria}.`);
    process.exit(1);
  }
}

const [comando, ...argumentos] = process.argv.slice(2);
if (!comando) {
  console.error('Diga qual comando rodar. Ex: node scripts/com-producao.mjs pnpm exec prisma migrate deploy');
  process.exit(1);
}

// Aviso bem visivel: dai nunca ha duvida sobre qual banco esta na linha.
console.error(`\n  ===> BANCO DE PRODUCAO: ${new URL(process.env.DATABASE_URL).hostname}\n`);

const resultado = spawnSync(comando, argumentos, { stdio: 'inherit', env: process.env });
process.exit(resultado.status ?? 1);
