-- CreateEnum
CREATE TYPE "ModoTaxaEntrega" AS ENUM ('unica', 'por_bairro');

-- CreateEnum
CREATE TYPE "TipoPromocao" AS ENUM ('desconto_item', 'combo_autonomo');

-- CreateTable
CREATE TABLE "restaurante" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "horario_abertura" VARCHAR(5) NOT NULL,
    "horario_fechamento" VARCHAR(5) NOT NULL,
    "aberto_manual" BOOLEAN NOT NULL DEFAULT true,
    "formas_pagamento" TEXT[],
    "modo_taxa_entrega" "ModoTaxaEntrega" NOT NULL DEFAULT 'por_bairro',
    "taxa_entrega_unica" DECIMAL(10,2),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dono" (
    "id" UUID NOT NULL,
    "restaurante_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dono_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_cardapio" (
    "id" UUID NOT NULL,
    "restaurante_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "categoria" TEXT NOT NULL,
    "mais_pedido" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "foto_url" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_cardapio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promocao" (
    "id" UUID NOT NULL,
    "restaurante_id" UUID NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "tipo" "TipoPromocao" NOT NULL,
    "item_cardapio_id" UUID,
    "nome" TEXT,
    "descricao" TEXT,
    "selo" TEXT NOT NULL,
    "preco_promocional" DECIMAL(10,2) NOT NULL,
    "preco_cheio" DECIMAL(10,2),
    "foto_url" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promocao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifa_bairro" (
    "id" UUID NOT NULL,
    "restaurante_id" UUID NOT NULL,
    "bairro" TEXT NOT NULL,
    "valor_taxa" DECIMAL(10,2) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarifa_bairro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dono_email_key" ON "dono"("email");

-- CreateIndex
CREATE INDEX "dono_restaurante_id_idx" ON "dono"("restaurante_id");

-- CreateIndex
CREATE INDEX "item_cardapio_restaurante_id_categoria_idx" ON "item_cardapio"("restaurante_id", "categoria");

-- CreateIndex
CREATE INDEX "promocao_restaurante_id_idx" ON "promocao"("restaurante_id");

-- CreateIndex
CREATE INDEX "promocao_item_cardapio_id_idx" ON "promocao"("item_cardapio_id");

-- CreateIndex
CREATE UNIQUE INDEX "tarifa_bairro_restaurante_id_bairro_key" ON "tarifa_bairro"("restaurante_id", "bairro");

-- AddForeignKey
ALTER TABLE "dono" ADD CONSTRAINT "dono_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_cardapio" ADD CONSTRAINT "item_cardapio_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promocao" ADD CONSTRAINT "promocao_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promocao" ADD CONSTRAINT "promocao_item_cardapio_id_fkey" FOREIGN KEY ("item_cardapio_id") REFERENCES "item_cardapio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifa_bairro" ADD CONSTRAINT "tarifa_bairro_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
