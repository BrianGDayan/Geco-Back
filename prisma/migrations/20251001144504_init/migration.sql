-- CreateTable
CREATE TABLE "detalle" (
    "id_detalle" SERIAL NOT NULL,
    "posicion" VARCHAR(10) NOT NULL,
    "tipo" INTEGER NOT NULL,
    "medida_diametro" INTEGER NOT NULL,
    "longitud_corte" REAL NOT NULL,
    "cantidad_unitaria" INTEGER NOT NULL,
    "nro_elementos" INTEGER NOT NULL,
    "cantidad_total" INTEGER NOT NULL,
    "id_elemento" INTEGER NOT NULL,
    "progreso" INTEGER NOT NULL DEFAULT 0,
    "especificacion" TEXT NOT NULL,
    "campos_modificados" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "detalle_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "diametro" (
    "medida_diametro" INTEGER NOT NULL,
    "peso_por_metro" REAL NOT NULL,

    CONSTRAINT "diametro_pkey" PRIMARY KEY ("medida_diametro")
);

-- CreateTable
CREATE TABLE "elemento" (
    "id_elemento" SERIAL NOT NULL,
    "nombre_elemento" VARCHAR(150) NOT NULL,
    "nro_planilla" VARCHAR(50) NOT NULL,
    "progreso" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "elemento_pkey" PRIMARY KEY ("id_elemento")
);

-- CreateTable
CREATE TABLE "planilla" (
    "nro_planilla" VARCHAR(30) NOT NULL,
    "obra" VARCHAR(30) NOT NULL,
    "nro_plano" VARCHAR(30) NOT NULL,
    "sector" VARCHAR(30) NOT NULL,
    "encargado_elaborar" VARCHAR(5) NOT NULL,
    "encargado_revisar" VARCHAR(5) NOT NULL,
    "encargado_aprobar" VARCHAR(5),
    "fecha" DATE NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "item" VARCHAR(20) NOT NULL,
    "progreso" INTEGER NOT NULL DEFAULT 0,
    "id_usuario" INTEGER NOT NULL,
    "rendimiento_global_corte_ayudante" REAL NOT NULL DEFAULT 0,
    "rendimiento_global_corte_trabajador" REAL NOT NULL DEFAULT 0,
    "rendimiento_global_doblado_ayudante" REAL NOT NULL DEFAULT 0,
    "rendimiento_global_doblado_trabajador" REAL NOT NULL DEFAULT 0,
    "rendimiento_global_empaquetado_ayudante" REAL NOT NULL DEFAULT 0,
    "rendimiento_global_empaquetado_trabajador" REAL NOT NULL DEFAULT 0,
    "pesos_diametro" JSONB NOT NULL DEFAULT '[]',
    "peso_total" REAL NOT NULL DEFAULT 0,

    CONSTRAINT "planilla_pkey" PRIMARY KEY ("nro_planilla")
);

-- CreateTable
CREATE TABLE "trabajador" (
    "id_trabajador" SERIAL NOT NULL,
    "nombre" VARCHAR(20) NOT NULL,
    "rendimiento_corte" REAL NOT NULL DEFAULT 0,
    "rendimiento_doblado" REAL NOT NULL DEFAULT 0,
    "rendimiento_empaquetado" REAL NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "trabajador_pkey" PRIMARY KEY ("id_trabajador")
);

-- CreateTable
CREATE TABLE "registro" (
    "id_registro" SERIAL NOT NULL,
    "id_detalle_tarea" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "horas_trabajador" REAL NOT NULL,
    "horas_ayudante" REAL NOT NULL,
    "rendimiento_trabajador" REAL NOT NULL,
    "rendimiento_ayudante" REAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_ayudante" INTEGER,
    "id_trabajador" INTEGER NOT NULL,

    CONSTRAINT "registro_pkey" PRIMARY KEY ("id_registro")
);

-- CreateTable
CREATE TABLE "tarea" (
    "id_tarea" SERIAL NOT NULL,
    "nombre_tarea" VARCHAR(15) NOT NULL,

    CONSTRAINT "tarea_pkey" PRIMARY KEY ("id_tarea")
);

-- CreateTable
CREATE TABLE "detalle_tarea" (
    "id_detalle_tarea" SERIAL NOT NULL,
    "id_detalle" INTEGER NOT NULL,
    "id_tarea" INTEGER NOT NULL,
    "cantidad_acumulada" INTEGER NOT NULL DEFAULT 0,
    "completado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "detalle_tarea_pkey" PRIMARY KEY ("id_detalle_tarea")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "clave" VARCHAR(16) NOT NULL,
    "rol" VARCHAR(12) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateIndex
CREATE UNIQUE INDEX "trabajador_nombre_key" ON "trabajador"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tarea_nombre_tarea_key" ON "tarea"("nombre_tarea");

-- CreateIndex
CREATE INDEX "detalle_tarea_id_tarea_idx" ON "detalle_tarea"("id_tarea");

-- AddForeignKey
ALTER TABLE "detalle" ADD CONSTRAINT "id_elemento" FOREIGN KEY ("id_elemento") REFERENCES "elemento"("id_elemento") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle" ADD CONSTRAINT "medida_diametro" FOREIGN KEY ("medida_diametro") REFERENCES "diametro"("medida_diametro") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "elemento" ADD CONSTRAINT "nro_planilla" FOREIGN KEY ("nro_planilla") REFERENCES "planilla"("nro_planilla") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "planilla" ADD CONSTRAINT "id_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registro" ADD CONSTRAINT "id_detalle_tarea" FOREIGN KEY ("id_detalle_tarea") REFERENCES "detalle_tarea"("id_detalle_tarea") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registro" ADD CONSTRAINT "id_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registro" ADD CONSTRAINT "registro_id_ayudante_fkey" FOREIGN KEY ("id_ayudante") REFERENCES "trabajador"("id_trabajador") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro" ADD CONSTRAINT "registro_id_trabajador_fkey" FOREIGN KEY ("id_trabajador") REFERENCES "trabajador"("id_trabajador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_tarea" ADD CONSTRAINT "detalle_tarea_id_tarea_fkey" FOREIGN KEY ("id_tarea") REFERENCES "tarea"("id_tarea") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_tarea" ADD CONSTRAINT "id_detalle" FOREIGN KEY ("id_detalle") REFERENCES "detalle"("id_detalle") ON DELETE CASCADE ON UPDATE NO ACTION;
