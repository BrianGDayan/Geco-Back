/*
  Warnings:

  - A unique constraint covering the columns `[nombre_tarea]` on the table `tarea` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
CREATE SEQUENCE tarea_id_tarea_seq;
ALTER TABLE "tarea" ALTER COLUMN "id_tarea" SET DEFAULT nextval('tarea_id_tarea_seq');
ALTER SEQUENCE tarea_id_tarea_seq OWNED BY "tarea"."id_tarea";

-- CreateIndex
CREATE UNIQUE INDEX "tarea_nombre_tarea_key" ON "tarea"("nombre_tarea");
