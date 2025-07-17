/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `trabajador` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "trabajador_nombre_key" ON "trabajador"("nombre");
