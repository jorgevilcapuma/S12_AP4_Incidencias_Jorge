import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../core/api.config';
import { Incidencia, IncidenciaPayload, ModoDatos } from '../models/incidencia.model';
import { LocalStorageRepository } from './local-storage.repository';

/**
 * Servicio CRUD de incidencias.
 * Mantiene el estado con signals y trabaja contra la API (SQL Server);
 * si la API no responde, cambia automáticamente a modo local (localStorage).
 */
@Injectable({ providedIn: 'root' })
export class IncidenciaService {
  private readonly http = inject(HttpClient);
  private readonly local = inject(LocalStorageRepository);
  private readonly url = `${API_URL}/incidencias`;

  private readonly _incidencias = signal<Incidencia[]>([]);
  readonly incidencias = this._incidencias.asReadonly();
  readonly modo = signal<ModoDatos>('api');
  readonly cargando = signal(false);

  readonly activas = computed(() => this._incidencias().filter((i) => i.activo));
  readonly inactivas = computed(() => this._incidencias().filter((i) => !i.activo));

  readonly resumen = computed(() => {
    const items = this.activas();
    return {
      total: items.length,
      pendientes: items.filter((i) => i.estado === 'Pendiente').length,
      enProceso: items.filter((i) => i.estado === 'En proceso').length,
      resueltas: items.filter((i) => i.estado === 'Resuelta').length,
      criticas: items.filter((i) => i.prioridad === 'Alta' && i.estado !== 'Resuelta').length,
    };
  });

  /** LISTAR: obtiene todas las incidencias (activas e inactivas). */
  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const data = await firstValueFrom(this.http.get<Incidencia[]>(this.url, { params: { activo: 'todos' } }));
      this.modo.set('api');
      this._incidencias.set(data);
    } catch (err) {
      if (!this.esErrorDeConexion(err)) throw err;
      this.usarModoLocal();
    } finally {
      this.cargando.set(false);
    }
  }

  /** VISUALIZAR: obtiene una incidencia por id. */
  async obtener(id: number): Promise<Incidencia | undefined> {
    if (this.modo() === 'local') return this.local.listar().find((i) => i.id === id);
    try {
      return await firstValueFrom(this.http.get<Incidencia>(`${this.url}/${id}`));
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) return undefined;
      if (!this.esErrorDeConexion(err)) throw err;
      this.usarModoLocal();
      return this.local.listar().find((i) => i.id === id);
    }
  }

  /** REGISTRAR */
  async crear(data: IncidenciaPayload): Promise<Incidencia> {
    const nueva = await this.ejecutar(
      () => this.http.post<Incidencia>(this.url, data),
      () => this.local.crear(data),
    );
    this._incidencias.update((items) => [nueva, ...items]);
    return nueva;
  }

  /** ACTUALIZAR */
  async actualizar(id: number, data: IncidenciaPayload): Promise<Incidencia> {
    const editada = await this.ejecutar(
      () => this.http.put<Incidencia>(`${this.url}/${id}`, data),
      () => this.local.actualizar(id, data),
    );
    this._incidencias.update((items) => items.map((i) => (i.id === id ? editada : i)));
    return editada;
  }

  /** ELIMINAR (lógico): la incidencia pasa a Inactivo y se puede restaurar. */
  async desactivar(id: number): Promise<Incidencia> {
    const inc = await this.ejecutar(
      () => this.http.delete<Incidencia>(`${this.url}/${id}`),
      () => this.local.actualizar(id, { activo: false }),
    );
    this.reemplazar(inc);
    return inc;
  }

  /** RESTAURAR: la incidencia vuelve a Activo. */
  async restaurar(id: number): Promise<Incidencia> {
    const inc = await this.ejecutar(
      () => this.http.patch<Incidencia>(`${this.url}/${id}/restaurar`, {}),
      () => this.local.actualizar(id, { activo: true }),
    );
    this.reemplazar(inc);
    return inc;
  }

  /** ELIMINAR DEFINITIVAMENTE: borra la fila de la base de datos (solo inactivas). */
  async eliminarDefinitivo(id: number): Promise<void> {
    await this.ejecutar(
      () => this.http.delete<void>(`${this.url}/${id}/definitivo`),
      () => this.local.eliminarDefinitivo(id),
    );
    this._incidencias.update((items) => items.filter((i) => i.id !== id));
  }

  private reemplazar(inc: Incidencia): void {
    this._incidencias.update((items) => items.map((i) => (i.id === inc.id ? inc : i)));
  }

  /** Ejecuta la operación en la API o, si no hay conexión, en el almacenamiento local. */
  private async ejecutar<T>(api: () => import('rxjs').Observable<T>, fallback: () => T): Promise<T> {
    if (this.modo() === 'local') return fallback();
    try {
      return await firstValueFrom(api());
    } catch (err) {
      if (!this.esErrorDeConexion(err)) throw err;
      this.usarModoLocal();
      return fallback();
    }
  }

  private usarModoLocal(): void {
    this.modo.set('local');
    this._incidencias.set(this.local.listar());
  }

  private esErrorDeConexion(err: unknown): boolean {
    return err instanceof HttpErrorResponse && (err.status === 0 || err.status >= 500);
  }
}
