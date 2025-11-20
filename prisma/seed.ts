import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1) Tareas
  const tareas = [
    { nombre_tarea: 'Corte' },
    { nombre_tarea: 'Doblado' },
    { nombre_tarea: 'Empaquetado' },
  ];

  for (const tarea of tareas) {
    await prisma.tarea.upsert({
      where: { nombre_tarea: tarea.nombre_tarea },
      update: {},
      create: tarea,
    });
  }

  // 2) Diámetros
  const diametros = [
    { medida_diametro: 6, peso_por_metro: 0.222 },
    { medida_diametro: 8, peso_por_metro: 0.395 },
    { medida_diametro: 10, peso_por_metro: 0.617 },
    { medida_diametro: 12, peso_por_metro: 0.888 },
    { medida_diametro: 16, peso_por_metro: 1.58 },
    { medida_diametro: 20, peso_por_metro: 2.47 },
    { medida_diametro: 25, peso_por_metro: 3.85 },
  ];

  for (const d of diametros) {
    await prisma.diametro.upsert({
      where: { medida_diametro: d.medida_diametro },
      update: { peso_por_metro: d.peso_por_metro },
      create: {
        medida_diametro: d.medida_diametro,
        peso_por_metro: d.peso_por_metro,
      },
    });
  }

  // 3) Trabajadores
  const trabajadores = [
    'Hipólito Colque',
    'Gerónimo Aguilar',
    'Martín Canchi',
    'Kevin Chávez',
    'Martín Flores',
    'Cristian Huanco',
    'Augusto Maidana',
  ];

  for (const nombre of trabajadores) {
    await prisma.trabajador.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  // 4) Usuarios (Admin y Encargado)
  await prisma.usuario.upsert({
    where: { id_usuario: 1 }, // cualquier ID fijo para upsert
    update: {},
    create: {
      clave: "admin2025",
      rol: "admin",
    },
  });

  await prisma.usuario.upsert({
    where: { id_usuario: 2 },
    update: {},
    create: {
      clave: "geco2025",
      rol: "encargado",
    },
  });

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
