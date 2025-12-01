export const TAREAS = {
  CORTE: 1,
  DOBLADO: 2,
  EMPAQUETADO: 3,
} as const;

export const CONFIG_TIPO: Record<number, { aplica: number[] }> = {
  1: {
    aplica: [TAREAS.CORTE, TAREAS.EMPAQUETADO], // tipo 1 NO tiene doblado
  },
  2: {
    aplica: [TAREAS.CORTE, TAREAS.DOBLADO, TAREAS.EMPAQUETADO],
  },
  3: {
    aplica: [TAREAS.CORTE, TAREAS.DOBLADO, TAREAS.EMPAQUETADO],
  },
  4: {
    aplica: [TAREAS.CORTE, TAREAS.DOBLADO], // tipo 4 NO tiene empaquetado
  },
};

export function tareaAplicaATipo(tipo: number, idTarea: number): boolean {
  const cfg = CONFIG_TIPO[tipo];
  if (!cfg) return false;
  return cfg.aplica.includes(idTarea);
}
