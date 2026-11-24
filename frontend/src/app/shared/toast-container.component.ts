import { Component, inject } from '@angular/core';
import { Toast, ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="stack" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="'toast ' + t.tipo" (click)="toast.cerrar(t.id)">
          <span class="dot"></span>
          <span class="msg">{{ t.mensaje }}</span>
          @if (t.accion) {
            <button type="button" (click)="ejecutar(t, $event)">{{ t.accion.texto }}</button>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .stack { position: fixed; right: 16px; bottom: 16px; z-index: 60; display: grid; gap: 10px; }
    .toast {
      display: flex; align-items: center; gap: 10px; cursor: pointer;
      padding: 12px 16px; border-radius: 12px; max-width: 380px;
      background: var(--ink); color: #fff; box-shadow: var(--shadow-lg);
      font-size: 0.9rem; animation: slide 0.2s ease-out;
    }
    .msg { flex: 1; }
    .dot { width: 10px; height: 10px; border-radius: 50%; flex: none; }
    .exito .dot { background: #34d399; }
    .error .dot { background: #f87171; }
    .info .dot  { background: #60a5fa; }
    button {
      border: 0; border-radius: 8px; padding: 6px 12px; cursor: pointer;
      background: var(--coral); color: #fff; font: 700 0.82rem var(--font-body);
      &:hover { background: var(--coral-dark); }
    }
    @keyframes slide { from { transform: translateY(12px); opacity: 0; } }
  `,
})
export class ToastContainerComponent {
  readonly toast = inject(ToastService);

  ejecutar(t: Toast, ev: Event): void {
    ev.stopPropagation();
    t.accion?.ejecutar();
    this.toast.cerrar(t.id);
  }
}
