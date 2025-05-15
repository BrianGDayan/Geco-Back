/*
  Warnings:

  - You are about to drop the column `Peso_total` on the `planilla` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "planilla" DROP COLUMN "Peso_total",
ADD COLUMN     "peso_estimado" REAL NOT NULL DEFAULT 0,
ADD COLUMN     "peso_total" REAL NOT NULL DEFAULT 0,
ADD COLUMN     "pesos_diametro" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[];
