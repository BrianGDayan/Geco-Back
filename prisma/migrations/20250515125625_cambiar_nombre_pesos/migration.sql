/*
  Warnings:

  - You are about to drop the column `peso_total` on the `planilla` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "planilla" DROP COLUMN "peso_total",
ADD COLUMN     "peso_producido" REAL NOT NULL DEFAULT 0;
