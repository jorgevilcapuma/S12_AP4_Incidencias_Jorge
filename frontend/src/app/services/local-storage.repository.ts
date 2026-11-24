import { Injectable } from '@angular/core';
import { Incidencia, IncidenciaPayload } from '../models/incidencia.model';

const STORAGE_KEY = 'soportevg.incidencias';

const DATOS_INICIALES: Incidencia[] = [
  { id: 5, codigo: 'INC-005', titulo: 'Impresora atascada Secretaría', descripcion: 'La impresora de secretaría presenta atascos constantes de papel.', responsable: 'Pedro Salazar', prioridad: 'Baja', estado: 'En proceso', fecha: '2026-11-20', activo: true },
  { id: 4, codigo: 'INC-004', titulo: 'Proyector dañado Aula 12', descripcion: 'El proyector del aula 12 no enciende; se sospecha falla de lámpara.', responsable: 'Ana Huamán', prioridad: 'Media', estado: 'Pendiente', fecha: '2026-11-21', activo: true },
  { id: 3, codigo: 'INC-003', titulo: 'Actualización Office', descripcion: 'Actualizar la suite Office a la última versión en el área administrativa.', responsable: 'Luis Torres', prioridad: 'Baja', estado: 'Resuelta', fecha: '2026-11-22', activo: true },
  { id: 2, codigo: 'INC-002', titulo: 'Error acceso portal', descripcion: 'Los estudiantes reportan error 500 al iniciar sesión en el portal académico.', responsable: 'María Quispe', prioridad: 'Media', estado: 'Pendiente', fecha: '2026-11-23', activo: true },
  { id: 1, codigo: 'INC-001', titulo: 'Falla de red Lab 04', descripcion: 'Los equipos del laboratorio 04 no tienen acceso a internet desde la mañana.', responsable: 'Carlos Ramos', prioridad: 'Alta', estado: 'En proceso', fecha: '2026-11-23', activo: true },
];

/**
 * Repositorio de respaldo en localStorage.
 * Se usa cuando la API / SQL Server no está disponible (modo "Datos locales").
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageRepository {
  listar(): Incidencia[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const items = raw ? (JSON.parse(raw) as Incidencia[]) : [...DATOS_INICIALES];
      return items.map((i) => ({ ...i, activo: i.activo !== false }));
    } catch {
      return [...DATOS_INICIALES];
    }
  }

  guardarTodo(items: Incidencia[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* almacenamiento no disponible: se ignora */
    }
  }

  crear(data: IncidenciaPayload): Incidencia {
    const items = this.listar();
    const id = items.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const nueva: Incidencia = { ...data, id, codigo: `INC-${String(id).padStart(3, '0')}`, activo: true };
    this.guardarTodo([nueva, ...items]);
    return nueva;
  }

  actualizar(id: number, data: Partial<Incidencia>): Incidencia {
    const items = this.listar();
    const actual = items.find((i) => i.id === id);
    if (!actual) throw new Error('Incidencia no encontrada');
    const editada: Incidencia = { ...actual, ...data };
    this.guardarTodo(items.map((i) => (i.id === id ? editada : i)));
    return editada;
  }

  eliminarDefinitivo(id: number): void {
    this.guardarTodo(this.listar().filter((i) => i.id !== id));
  }
}
