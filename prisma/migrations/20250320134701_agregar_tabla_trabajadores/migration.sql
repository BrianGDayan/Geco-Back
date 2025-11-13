/*
  Warnings:

  - Added the required column `id_trabajador` to the `registro` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "detalle" DROP CONSTRAINT "id_elemento";

-- DropForeignKey
ALTER TABLE "detalle_tarea" DROP CONSTRAINT "detalle_tarea_id_detalle_fkey";

-- DropForeignKey
ALTER TABLE "elemento" DROP CONSTRAINT "nro_planilla";

-- DropForeignKey
ALTER TABLE "registro" DROP CONSTRAINT "registro_id_detalle_tarea_fkey";

-- AlterTable
ALTER TABLE "planilla" ADD COLUMN     "rendimiento_global_corte" REAL NOT NULL DEFAULT 0,
ADD COLUMN     "rendimiento_global_doblado" REAL NOT NULL DEFAULT 0,
ADD COLUMN     "rendimiento_global_empaquetado" REAL NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "registro" ADD COLUMN     "id_ayudante" INTEGER,
ADD COLUMN     "id_trabajador" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "trabajador" (
    "id_trabajador" SERIAL NOT NULL,
    "nombre" VARCHAR(20) NOT NULL,
    "rendimiento_corte" REAL NOT NULL,
    "rendimiento_doblado" REAL NOT NULL,
    "rendimiento_empaquetado" REAL NOT NULL,

    CONSTRAINT "trabajador_pkey" PRIMARY KEY ("id_trabajador")
);

-- AddForeignKey
ALTER TABLE "detalle" ADD CONSTRAINT "id_elemento" FOREIGN KEY ("id_elemento") REFERENCES "elemento"("id_elemento") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "elemento" ADD CONSTRAINT "nro_planilla" FOREIGN KEY ("nro_planilla") REFERENCES "planilla"("nro_planilla") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registro" ADD CONSTRAINT "id_detalle_tarea" FOREIGN KEY ("id_detalle_tarea") REFERENCES "detalle_tarea"("id_detalle_tarea") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registro" ADD CONSTRAINT "registro_id_trabajador_fkey" FOREIGN KEY ("id_trabajador") REFERENCES "trabajador"("id_trabajador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro" ADD CONSTRAINT "registro_id_ayudante_fkey" FOREIGN KEY ("id_ayudante") REFERENCES "trabajador"("id_trabajador") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_tarea" ADD CONSTRAINT "id_detalle" FOREIGN KEY ("id_detalle") REFERENCES "detalle"("id_detalle") ON DELETE CASCADE ON UPDATE NO ACTION;
