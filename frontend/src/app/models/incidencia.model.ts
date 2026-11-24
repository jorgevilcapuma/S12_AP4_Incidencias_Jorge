export type Prioridad = 'Alta' | 'Media' | 'Baja';
export type Estado = 'Pendiente' | 'En proceso' | 'Resuelta';

export interface Incidencia {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  responsable: string;
  prioridad: Prioridad;
  estado: Estado;
  fecha: string; // formato ISO: YYYY-MM-DD
  activo: boolean; // true = Activo, false = Inactivo (eliminado lógicamente, se puede restaurar)
}

/** Datos que se envían al registrar o actualizar (id, código y activo los gestiona el sistema). */
export type IncidenciaPayload = Omit<Incidencia, 'id' | 'codigo' | 'activo'>;

export const PRIORIDADES: Prioridad[] = ['Alta', 'Media', 'Baja'];
export const ESTADOS: Estado[] = ['Pendiente', 'En proceso', 'Resuelta'];

/** Origen de los datos: API conectada a SQL Server o almacenamiento local del navegador. */
export type ModoDatos = 'api' | 'local';
