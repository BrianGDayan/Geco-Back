/*
  Warnings:

  - You are about to drop the column `horas_ayudante` on the `registro` table. All the data in the column will be lost.
  - You are about to drop the column `horas_trabajador` on the `registro` table. All the data in the column will be lost.
  - You are about to drop the column `id_ayudante` on the `registro` table. All the data in the column will be lost.
  - You are about to drop the column `id_trabajador` on the `registro` table. All the data in the column will be lost.
  - You are about to drop the column `rendimiento_ayudante` on the `registro` table. All the data in the column will be lost.
  - You are about to drop the column `rendimiento_trabajador` on the `registro` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "registro" DROP CONSTRAINT "registro_id_ayudante_fkey";

-- DropForeignKey
ALTER TABLE "registro" DROP CONSTRAINT "registro_id_trabajador_fkey";

-- AlterTable
ALTER TABLE "planilla" ADD COLUMN     "rendimiento_global_doblado_ayudante2" REAL NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "registro" DROP COLUMN "horas_ayudante",
DROP COLUMN "horas_trabajador",
DROP COLUMN "id_ayudante",
DROP COLUMN "id_trabajador",
DROP COLUMN "rendimiento_ayudante",
DROP COLUMN "rendimiento_trabajador";

-- CreateTable
CREATE TABLE "registro_operador" (
    "id_registro_operador" SERIAL NOT NULL,
    "id_registro" INTEGER NOT NULL,
    "id_trabajador" INTEGER NOT NULL,
    "tiempo_horas" REAL NOT NULL,
    "cantidad_unidades" INTEGER NOT NULL,
    "rendimiento" REAL NOT NULL,

    CONSTRAINT "registro_operador_pkey" PRIMARY KEY ("id_registro_operador")
);

-- CreateIndex
CREATE INDEX "registro_operador_id_registro_idx" ON "registro_operador"("id_registro");

-- CreateIndex
CREATE INDEX "registro_operador_id_trabajador_idx" ON "registro_operador"("id_trabajador");

-- AddForeignKey
ALTER TABLE "registro_operador" ADD CONSTRAINT "registro_operador_id_registro_fkey" FOREIGN KEY ("id_registro") REFERENCES "registro"("id_registro") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_operador" ADD CONSTRAINT "registro_operador_id_trabajador_fkey" FOREIGN KEY ("id_trabajador") REFERENCES "trabajador"("id_trabajador") ON DELETE RESTRICT ON UPDATE CASCADE;
