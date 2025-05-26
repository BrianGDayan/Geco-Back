/*
  Warnings:

  - You are about to drop the column `peso_estimado` on the `planilla` table. All the data in the column will be lost.
  - You are about to drop the column `peso_producido` on the `planilla` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "planilla" DROP COLUMN "peso_estimado",
DROP COLUMN "peso_producido",
ADD COLUMN     "peso_total" REAL NOT NULL DEFAULT 0;
