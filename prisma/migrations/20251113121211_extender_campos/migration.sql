/*
  Warnings:

  - The primary key for the `planilla` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "elemento" DROP CONSTRAINT "nro_planilla";

-- AlterTable
ALTER TABLE "detalle" ALTER COLUMN "posicion" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "elemento" ALTER COLUMN "nro_planilla" SET DATA TYPE VARCHAR(80);

-- AlterTable
ALTER TABLE "planilla" DROP CONSTRAINT "planilla_pkey",
ALTER COLUMN "nro_planilla" SET DATA TYPE VARCHAR(80),
ALTER COLUMN "obra" SET DATA TYPE VARCHAR(80),
ALTER COLUMN "nro_plano" SET DATA TYPE VARCHAR(80),
ALTER COLUMN "sector" SET DATA TYPE VARCHAR(80),
ALTER COLUMN "item" SET DATA TYPE VARCHAR(50),
ADD CONSTRAINT "planilla_pkey" PRIMARY KEY ("nro_planilla");

-- AddForeignKey
ALTER TABLE "elemento" ADD CONSTRAINT "nro_planilla" FOREIGN KEY ("nro_planilla") REFERENCES "planilla"("nro_planilla") ON DELETE CASCADE ON UPDATE NO ACTION;
