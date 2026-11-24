import { Component, computed, input } from '@angular/core';

/** Etiqueta de color para prioridad o estado. */
@Component({
  selector: 'app-badge',
  template: `<span class="badge" [class]="'badge ' + clase()"><i></i>{{ valor() }}</span>`,
  styles: `
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 999px;
      font-size: 0.78rem; font-weight: 600; white-space: nowrap;
      background: var(--chip-bg); color: var(--chip-fg);
    }
    i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
    .alta       { --chip-bg: var(--red-soft);    --chip-fg: var(--red); }
    .media      { --chip-bg: var(--amber-soft);  --chip-fg: var(--amber); }
    .baja       { --chip-bg: var(--sky-soft);    --chip-fg: var(--sky); }
    .pendiente  { --chip-bg: var(--slate-soft);  --chip-fg: var(--slate); }
    .en-proceso { --chip-bg: var(--violet-soft); --chip-fg: var(--violet); }
    .resuelta   { --chip-bg: var(--green-soft);  --chip-fg: var(--green); }
    .activo     { --chip-bg: var(--green-soft);  --chip-fg: var(--green); }
    .inactivo   { --chip-bg: #f1f1f4;            --chip-fg: #8a8fa3; }
  `,
})
export class BadgeComponent {
  readonly valor = input.required<string>();
  readonly clase = computed(() => this.valor().toLowerCase().replace(/\s+/g, '-'));
}
