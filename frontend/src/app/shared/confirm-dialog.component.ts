import { Component, input, output } from '@angular/core';

/** Diálogo modal de confirmación (usado antes de eliminar). */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="overlay" (click)="cancelar.emit()">
      <div class="dialog" role="alertdialog" aria-modal="true" (click)="$event.stopPropagation()">
        <div class="icon">!</div>
        <h3>{{ titulo() }}</h3>
        <p>{{ mensaje() }}</p>
        <div class="actions">
          <button class="btn btn-ghost" (click)="cancelar.emit()">Cancelar</button>
          <button class="btn btn-danger" (click)="confirmar.emit()" [disabled]="procesando()">
            {{ procesando() ? 'Eliminando…' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .overlay {
      position: fixed; inset: 0; z-index: 50;
      background: rgb(10 16 40 / 0.55); backdrop-filter: blur(3px);
      display: grid; place-items: center; padding: 16px;
      animation: fade 0.15s ease-out;
    }
    .dialog {
      background: var(--surface); border-radius: 18px; padding: 28px;
      width: min(420px, 100%); text-align: center; box-shadow: var(--shadow-lg);
      animation: pop 0.18s ease-out;
    }
    .icon {
      width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 50%;
      display: grid; place-items: center; font: 700 1.6rem var(--font-title);
      background: var(--red-soft); color: var(--red);
    }
    h3 { margin: 0 0 8px; font-family: var(--font-title); }
    p { margin: 0 0 22px; color: var(--muted); line-height: 1.5; }
    .actions { display: flex; gap: 10px; justify-content: center; }
    @keyframes fade { from { opacity: 0; } }
    @keyframes pop { from { transform: scale(0.94); opacity: 0; } }
  `,
})
export class ConfirmDialogComponent {
  readonly titulo = input('¿Confirmar acción?');
  readonly mensaje = input('');
  readonly procesando = input(false);
  readonly confirmar = output<void>();
  readonly cancelar = output<void>();
}
