import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'incidencias',
    loadComponent: () =>
      import('./pages/incidencia-list/incidencia-list.component').then((m) => m.IncidenciaListComponent),
    title: 'Incidencias · SoporteVG',
  },
  {
    path: 'incidencias/nueva',
    loadComponent: () =>
      import('./pages/incidencia-form/incidencia-form.component').then((m) => m.IncidenciaFormComponent),
    title: 'Nueva incidencia · SoporteVG',
  },
  {
    path: 'incidencias/:id',
    loadComponent: () =>
      import('./pages/incidencia-detail/incidencia-detail.component').then((m) => m.IncidenciaDetailComponent),
    title: 'Detalle · SoporteVG',
  },
  {
    path: 'incidencias/:id/editar',
    loadComponent: () =>
      import('./pages/incidencia-form/incidencia-form.component').then((m) => m.IncidenciaFormComponent),
    title: 'Editar incidencia · SoporteVG',
  },
  { path: '', redirectTo: 'incidencias', pathMatch: 'full' },
  { path: '**', redirectTo: 'incidencias' },
];
