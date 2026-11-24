import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ESTADOS, Estado, Incidencia, PRIORIDADES, Prioridad } from '../../models/incidencia.model';
import { IncidenciaService } from '../../services/incidencia.service';
import { ToastService } from '../../services/toast.service';
import { BadgeComponent } from '../../shared/badge.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { FechaPipe } from '../../shared/fecha.pipe';

@Component({
  selector: 'app-incidencia-list',
  imports: [RouterLink, BadgeComponent, ConfirmDialogComponent, FechaPipe],
  templateUrl: './incidencia-list.component.html',
  styleUrl: './incidencia-list.component.scss',
})
export class IncidenciaListComponent implements OnInit {
  readonly service = inject(IncidenciaService);
  private readonly toast = inject(ToastService);

  readonly prioridades = PRIORIDADES;
  readonly estados = ESTADOS;

  // Filtros
  readonly busqueda = signal('');
  readonly filtroPrioridad = signal<Prioridad | ''>('');
  readonly filtroEstado = signal<Estado | ''>('');

  /** Pestaña actual: incidencias activas o inactivas (eliminadas lógicamente). */
  readonly vista = signal<'activas' | 'inactivas'>('activas');

  // Eliminación (desactivar o eliminar definitivamente)
  readonly porEliminar = signal<Incidencia | null>(null);
  readonly eliminando = signal(false);

  readonly filtradas = computed(() => {
    const texto = this.normalizar(this.busqueda());
    const prioridad = this.filtroPrioridad();
    const estado = this.filtroEstado();
    const fuente = this.vista() === 'activas' ? this.service.activas() : this.service.inactivas();
    return fuente.filter(
      (i) =>
        (!texto || this.normalizar(i.titulo).includes(texto) || this.normalizar(i.codigo).includes(texto)) &&
        (!prioridad || i.prioridad === prioridad) &&
        (!estado || i.estado === estado),
    );
  });

  readonly hayFiltros = computed(() => !!(this.busqueda() || this.filtroPrioridad() || this.filtroEstado()));

  ngOnInit(): void {
    this.service.cargar().catch(() => this.toast.mostrar('No se pudieron cargar las incidencias', 'error'));
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroPrioridad.set('');
    this.filtroEstado.set('');
  }

  /** Atajo desde las tarjetas de resumen. */
  filtrarPorEstado(estado: Estado | ''): void {
    this.filtroEstado.set(this.filtroEstado() === estado ? '' : estado);
  }

  /** Activas: pasa a Inactivo. Inactivas: elimina definitivamente de la BD. */
  async confirmarEliminacion(): Promise<void> {
    const inc = this.porEliminar();
    if (!inc) return;
    this.eliminando.set(true);
    try {
      if (inc.activo) {
        await this.service.desactivar(inc.id);
        this.toast.mostrar(`${inc.codigo} pasó a Inactivas`, 'info', {
          texto: 'Deshacer',
          ejecutar: () => this.restaurar(inc),
        });
      } else {
        await this.service.eliminarDefinitivo(inc.id);
        this.toast.mostrar(`${inc.codigo} eliminada definitivamente`);
      }
      this.porEliminar.set(null);
    } catch {
      this.toast.mostrar('No se pudo eliminar la incidencia', 'error');
    } finally {
      this.eliminando.set(false);
    }
  }

  async restaurar(inc: Incidencia): Promise<void> {
    try {
      await this.service.restaurar(inc.id);
      this.toast.mostrar(`${inc.codigo} restaurada como Activa`);
    } catch {
      this.toast.mostrar('No se pudo restaurar la incidencia', 'error');
    }
  }

  private normalizar(v: string): string {
    return v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }
}
