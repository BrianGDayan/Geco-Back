/*
  Warnings:

  - You are about to drop the column `rendimiento_global_corte` on the `planilla` table. All the data in the column will be lost.
  - You are about to drop the column `rendimiento_global_doblado` on the `planilla` table. All the data in the column will be lost.
  - You are about to drop the column `rendimiento_global_empaquetado` on the `planilla` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "planilla" DROP COLUMN "rendimiento_global_corte",
DROP COLUMN "rendimiento_global_doblado",
DROP COLUMN "rendimiento_global_empaquetado",
ADD COLUMN     "rendimiento_global_corte_ayudante" REAL NOT NULL DEFAULT 0,
ADD COLUMN     "rendimiento_global_corte_trabajador" REAL NOT NULL DEFAULT 0,
ADD COLUMN     "rendimiento_global_doblado_ayudante" REAL NOT NULL DEFAULT 0,
ADD COLUMN     "rendimiento_global_doblado_trabajador" REAL NOT NULL DEFAULT 0,
ADD COLUMN     "rendimiento_global_empaquetado_ayudante" REAL NOT NULL DEFAULT 0,
ADD COLUMN     "rendimiento_global_empaquetado_trabajador" REAL NOT NULL DEFAULT 0;
