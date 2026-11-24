import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ESTADOS, Estado, IncidenciaPayload, PRIORIDADES, Prioridad } from '../../models/incidencia.model';
import { IncidenciaService } from '../../services/incidencia.service';
import { ToastService } from '../../services/toast.service';
import { BadgeComponent } from '../../shared/badge.component';
import { FechaPipe } from '../../shared/fecha.pipe';
import { fechaNoFutura, hoyISO, noSoloEspacios } from '../../shared/validators';

@Component({
  selector: 'app-incidencia-form',
  imports: [ReactiveFormsModule, RouterLink, BadgeComponent, FechaPipe],
  templateUrl: './incidencia-form.component.html',
  styleUrl: './incidencia-form.component.scss',
})
export class IncidenciaFormComponent implements OnInit {
  /** Parámetro de ruta :id (solo existe en modo edición). */
  readonly id = input<string>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(IncidenciaService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly prioridades = PRIORIDADES;
  readonly estados = ESTADOS;
  readonly hoy = hoyISO();

  readonly esEdicion = computed(() => !!this.id());
  readonly codigo = signal<string>('');
  readonly cargando = signal(false);
  readonly guardando = signal(false);

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100), noSoloEspacios]],
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500), noSoloEspacios]],
    responsable: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80),
      Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü .'-]+$/), noSoloEspacios]],
    prioridad: ['' as Prioridad | '', Validators.required],
    estado: ['Pendiente' as Estado | '', Validators.required],
    fecha: [this.hoy, [Validators.required, fechaNoFutura]],
  });

  /** Valores del formulario como signal para la vista previa en vivo. */
  readonly preview = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  async ngOnInit(): Promise<void> {
    const id = Number(this.id());
    if (!this.esEdicion()) return;

    this.cargando.set(true);
    try {
      const inc = await this.service.obtener(id);
      if (!inc) {
        this.toast.mostrar('La incidencia no existe', 'error');
        this.router.navigate(['/incidencias']);
        return;
      }
      this.codigo.set(inc.codigo);
      const { id: _id, codigo: _c, activo: _a, ...datos } = inc;
      this.form.setValue(datos);
    } catch {
      this.toast.mostrar('No se pudo cargar la incidencia', 'error');
    } finally {
      this.cargando.set(false);
    }
  }

  /** Muestra error solo cuando el campo fue tocado o se intentó enviar. */
  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  error(campo: keyof typeof this.form.controls): string {
    const e = this.form.controls[campo].errors;
    if (!e) return '';
    if (e['required'] || e['soloEspacios']) return 'Este campo es obligatorio.';
    if (e['minlength']) return `Mínimo ${e['minlength'].requiredLength} caracteres.`;
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    if (e['pattern']) return 'Solo se permiten letras y espacios.';
    if (e['fechaFutura']) return 'La fecha no puede ser posterior a hoy.';
    return 'Valor inválido.';
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.mostrar('Revisa los campos marcados en rojo', 'error');
      return;
    }

    const raw = this.form.getRawValue();
    const data: IncidenciaPayload = {
      ...raw,
      titulo: raw.titulo.trim(),
      descripcion: raw.descripcion.trim(),
      responsable: raw.responsable.trim(),
      prioridad: raw.prioridad as Prioridad,
      estado: raw.estado as Estado,
    };

    this.guardando.set(true);
    try {
      if (this.esEdicion()) {
        const inc = await this.service.actualizar(Number(this.id()), data);
        this.toast.mostrar(`Incidencia ${inc.codigo} actualizada`);
      } else {
        const inc = await this.service.crear(data);
        this.toast.mostrar(`Incidencia ${inc.codigo} registrada`);
      }
      this.router.navigate(['/incidencias']);
    } catch {
      this.toast.mostrar('No se pudo guardar la incidencia', 'error');
    } finally {
      this.guardando.set(false);
    }
  }
}
