/*
  Warnings:

  - You are about to drop the column `nro_iguales` on the `detalle` table. All the data in the column will be lost.
  - The primary key for the `planilla` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `encargado_elaborar` on the `planilla` table. The data in that column could be lost. The data in that column will be cast from `VarChar(15)` to `VarChar(5)`.
  - You are about to alter the column `encargado_revisar` on the `planilla` table. The data in that column could be lost. The data in that column will be cast from `VarChar(15)` to `VarChar(5)`.
  - You are about to alter the column `encargado_aprobar` on the `planilla` table. The data in that column could be lost. The data in that column will be cast from `VarChar(15)` to `VarChar(5)`.

*/
-- DropForeignKey
ALTER TABLE "elemento" DROP CONSTRAINT "nro_planilla";

-- AlterTable
ALTER TABLE "detalle" DROP COLUMN "nro_iguales";

-- AlterTable
ALTER TABLE "elemento" ALTER COLUMN "nombre_elemento" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "nro_planilla" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "planilla" DROP CONSTRAINT "planilla_pkey",
ALTER COLUMN "nro_planilla" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "encargado_elaborar" SET DATA TYPE VARCHAR(5),
ALTER COLUMN "encargado_revisar" SET DATA TYPE VARCHAR(5),
ALTER COLUMN "encargado_aprobar" SET DATA TYPE VARCHAR(5),
ADD CONSTRAINT "planilla_pkey" PRIMARY KEY ("nro_planilla");

-- AddForeignKey
ALTER TABLE "elemento" ADD CONSTRAINT "nro_planilla" FOREIGN KEY ("nro_planilla") REFERENCES "planilla"("nro_planilla") ON DELETE CASCADE ON UPDATE NO ACTION;
