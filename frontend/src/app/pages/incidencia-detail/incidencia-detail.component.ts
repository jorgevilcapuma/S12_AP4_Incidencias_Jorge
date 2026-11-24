import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ESTADOS, Incidencia } from '../../models/incidencia.model';
import { IncidenciaService } from '../../services/incidencia.service';
import { ToastService } from '../../services/toast.service';
import { BadgeComponent } from '../../shared/badge.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { FechaPipe } from '../../shared/fecha.pipe';

@Component({
  selector: 'app-incidencia-detail',
  imports: [RouterLink, BadgeComponent, ConfirmDialogComponent, FechaPipe],
  templateUrl: './incidencia-detail.component.html',
  styleUrl: './incidencia-detail.component.scss',
})
export class IncidenciaDetailComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly service = inject(IncidenciaService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly incidencia = signal<Incidencia | null>(null);
  readonly cargando = signal(true);
  readonly confirmando = signal(false);
  readonly eliminando = signal(false);

  readonly estados = ESTADOS;
  /** Índice del estado actual para la línea de progreso. */
  readonly paso = computed(() => ESTADOS.indexOf(this.incidencia()?.estado ?? 'Pendiente'));

  async ngOnInit(): Promise<void> {
    try {
      const inc = await this.service.obtener(Number(this.id()));
      if (!inc) {
        this.toast.mostrar('La incidencia no existe', 'error');
        this.router.navigate(['/incidencias']);
        return;
      }
      this.incidencia.set(inc);
    } catch {
      this.toast.mostrar('No se pudo cargar la incidencia', 'error');
    } finally {
      this.cargando.set(false);
    }
  }

  /** Activa: pasa a Inactivo. Inactiva: elimina definitivamente. */
  async eliminar(): Promise<void> {
    const inc = this.incidencia();
    if (!inc) return;
    this.eliminando.set(true);
    try {
      if (inc.activo) {
        this.incidencia.set(await this.service.desactivar(inc.id));
        this.toast.mostrar(`${inc.codigo} pasó a Inactivas`, 'info');
      } else {
        await this.service.eliminarDefinitivo(inc.id);
        this.toast.mostrar(`${inc.codigo} eliminada definitivamente`);
        this.router.navigate(['/incidencias']);
      }
      this.confirmando.set(false);
    } catch {
      this.toast.mostrar('No se pudo eliminar la incidencia', 'error');
    } finally {
      this.eliminando.set(false);
    }
  }

  async restaurar(): Promise<void> {
    const inc = this.incidencia();
    if (!inc) return;
    try {
      this.incidencia.set(await this.service.restaurar(inc.id));
      this.toast.mostrar(`${inc.codigo} restaurada como Activa`);
    } catch {
      this.toast.mostrar('No se pudo restaurar la incidencia', 'error');
    }
  }
}
