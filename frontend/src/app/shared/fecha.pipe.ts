import { Pipe, PipeTransform } from '@angular/core';

/** Convierte "2026-11-23" en "23/11/2026" sin desfases de zona horaria. */
@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const [y, m, d] = value.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
}
