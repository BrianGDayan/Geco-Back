/*
  Warnings:

  - The `pesos_diametro` column on the `planilla` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "planilla" DROP COLUMN "pesos_diametro",
ADD COLUMN     "pesos_diametro" JSONB NOT NULL DEFAULT '[]';
