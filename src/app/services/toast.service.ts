import { Injectable, signal } from '@angular/core';

export interface ToastAccion {
  texto: string;
  ejecutar: () => void;
}

export interface Toast {
  id: number;
  tipo: 'exito' | 'error' | 'info';
  mensaje: string;
  accion?: ToastAccion;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private seq = 0;

  mostrar(mensaje: string, tipo: Toast['tipo'] = 'exito', accion?: ToastAccion): void {
    const id = ++this.seq;
    this.toasts.update((t) => [...t, { id, tipo, mensaje, accion }]);
    setTimeout(() => this.cerrar(id), accion ? 6000 : 3500);
  }

  cerrar(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}
