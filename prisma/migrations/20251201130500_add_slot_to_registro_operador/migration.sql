/*
  Warnings:

  - Added the required column `slot` to the `registro_operador` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "registro_operador" ADD COLUMN     "slot" INTEGER NOT NULL;
