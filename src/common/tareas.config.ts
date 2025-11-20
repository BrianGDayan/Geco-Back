// Identificadores numéricos usados en tu BD
export const TAREAS = {
  CORTE: 1,
  DOBLADO: 2,
  EMPAQUETADO: 3,
} as const;

// Factor de complejidad aplicado SOLO en DOBLADO
export const CONFIG_TIPO: Record<number, { factorDoblado: number; aplica: number[] }> = {
  1: {
    factorDoblado: 1.00,
    aplica: [TAREAS.CORTE, TAREAS.EMPAQUETADO], // tipo 1 NO tiene doblado
  },
  2: {
    factorDoblado: 0.99,
    aplica: [TAREAS.CORTE, TAREAS.DOBLADO, TAREAS.EMPAQUETADO],
  },
  3: {
    factorDoblado: 1.00,
    aplica: [TAREAS.CORTE, TAREAS.DOBLADO, TAREAS.EMPAQUETADO],
  },
  4: {
    factorDoblado: 0.95,
    aplica: [TAREAS.CORTE, TAREAS.DOBLADO], // tipo 4 NO tiene empaquetado
  },
};

// Verifica si una tarea aplica a un tipo de detalle
export function tareaAplicaATipo(tipo: number, idTarea: number): boolean {
  const cfg = CONFIG_TIPO[tipo];
  if (!cfg) return false;
  return cfg.aplica.includes(idTarea);
}
