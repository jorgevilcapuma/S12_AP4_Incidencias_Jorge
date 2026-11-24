import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Fecha actual en formato YYYY-MM-DD según la zona horaria local. */
export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** No permite valores formados solo por espacios. */
export const noSoloEspacios: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
  typeof c.value === 'string' && c.value.length > 0 && !c.value.trim() ? { soloEspacios: true } : null;

/** No permite fechas posteriores a hoy. */
export const fechaNoFutura: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
  c.value && c.value > hoyISO() ? { fechaFutura: true } : null;
