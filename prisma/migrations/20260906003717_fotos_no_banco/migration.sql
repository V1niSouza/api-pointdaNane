/*
  Warnings:

  - You are about to drop the column `foto_url` on the `item_cardapio` table. All the data in the column will be lost.
  - You are about to drop the column `foto_url` on the `promocao` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "item_cardapio" DROP COLUMN "foto_url",
ADD COLUMN     "foto" BYTEA,
ADD COLUMN     "foto_tipo" TEXT;

-- AlterTable
ALTER TABLE "promocao" DROP COLUMN "foto_url",
ADD COLUMN     "foto" BYTEA,
ADD COLUMN     "foto_tipo" TEXT;
