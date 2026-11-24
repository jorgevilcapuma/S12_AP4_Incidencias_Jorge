# SoporteVG · Sistema de Gestión de Incidencias

Aplicación web CRUD desarrollada en **Angular 19 + TypeScript** para registrar y administrar incidencias institucionales (fallas de red, equipos, accesos, etc.). Los datos se guardan en **SQL Server** a través de una API REST en Node.js; si la API no está disponible, la app sigue funcionando en **modo local** (localStorage).

> **S06 | AP4 · Preparándonos para la Hackathon – Reto individual**
> Autor: **Jorge Vilcapuma** · Instituto Valle Grande

---

## Funcionalidades

| # | Requerimiento | Implementación |
|---|---|---|
| 1 | **Listar** | Tabla con código, título, responsable, prioridad, estado y fecha. En móvil se muestra como tarjetas. |
| 2 | **Registrar** | Formulario reactivo con validaciones activas y vista previa en vivo del ticket. |
| 3 | **Visualizar** | Página de detalle con línea de progreso del estado (Pendiente → En proceso → Resuelta). |
| 4 | **Actualizar** | El mismo formulario en modo edición, precargado con los datos. |
| 5 | **Eliminar** | Diálogo de confirmación. Es un **borrado lógico**: la incidencia pasa a **Inactivo** y se puede **restaurar** desde la pestaña *Inactivas* (o con "Deshacer" en la notificación). Desde *Inactivas* también se puede eliminar definitivamente. |
| 6 | **Buscar y filtrar** | Por título o código (no distingue tildes ni mayúsculas), por prioridad y por estado. Las tarjetas de resumen también filtran. |

**Extras de diseño:** identidad visual propia (paleta tinta + coral, tipografías Sora / DM Sans), tarjetas de resumen con contador de incidencias críticas abiertas, notificaciones toast, indicador de conexión a SQL Server, diseño responsive y código autogenerado (`INC-001`, `INC-002`…).

### Validaciones del formulario

| Campo | Regla |
|---|---|
| Título | Obligatorio, 5–100 caracteres |
| Descripción | Obligatorio, 10–500 caracteres |
| Responsable | Obligatorio, 3–80 caracteres, solo letras |
| Prioridad | Alta, Media o Baja |
| Estado | Pendiente, En proceso o Resuelta |
| Fecha | Obligatoria, no puede ser posterior a hoy |

La API vuelve a validar los mismos datos en el servidor, y la tabla tiene restricciones `CHECK`.

---

## Arquitectura

```
┌──────────────────────┐   HTTP/JSON   ┌──────────────────────┐    TDS     ┌──────────────────┐
│  Angular 19 (4200)   │ ────────────▶ │  API Express (3000)  │ ─────────▶ │ SQL Server 2022  │
│  Componentes (UI)    │               │  Rutas CRUD          │            │  IncidenciasDB   │
│  Servicios (lógica)  │ ◀──────────── │  Validación + mssql  │ ◀───────── │  (Docker :1433)  │
└──────────┬───────────┘               └──────────────────────┘            └──────────────────┘
           │ si la API no responde
           ▼
   localStorage (modo local)
```

- **Componentes:** UI standalone y responsive (listado, formulario, detalle, badge, diálogo, toasts).
- **Servicios:** `IncidenciaService` centraliza el CRUD y el estado con **signals**; `LocalStorageRepository` es el respaldo local.
- **Datos:** SQL Server mediante la API REST, o localStorage si la API está caída.

### Estructura del proyecto

```
├── src/app/                     # Aplicación Angular
│   ├── models/                  # Interfaces y tipos (Incidencia, Prioridad, Estado)
│   ├── services/                # IncidenciaService, LocalStorageRepository, ToastService
│   ├── pages/
│   │   ├── incidencia-list/     # Listar, buscar, filtrar, eliminar, restaurar
│   │   ├── incidencia-form/     # Registrar y editar
│   │   └── incidencia-detail/   # Visualizar
│   ├── shared/                  # Badge, diálogo de confirmación, toasts, pipe de fecha, validadores
│   └── core/api.config.ts       # URL de la API
├── backend/                     # API REST (Node.js + Express + mssql)
│   └── src/
│       ├── server.js            # Configuración de Express, CORS, health check
│       ├── db.js                # Pool de conexiones a SQL Server
│       └── incidencias.routes.js# Endpoints CRUD + validaciones
├── database/
│   ├── init.sql                 # Crea la BD, la tabla y los datos de ejemplo
│   └── crud.sql                 # Procedimientos almacenados CRUD
├── docker-compose.yml           # SQL Server + script de inicialización
├── angular.json / package.json  # Configuración del proyecto Angular
└── README.md
```

---

## Instalación y ejecución

### Requisitos
- Node.js 20+ y npm
- Angular CLI 19 (`npm i -g @angular/cli@19`)
- Docker Desktop (para SQL Server)
- *(Opcional)* SQL Server Management Studio para ver la base de datos

### 1. Clonar el repositorio
```bash
git clone https://github.com/jorgevilcapuma/S12_AP4_Incidencias_Jorge.git
cd S12_AP4_Incidencias_Jorge
```

### 2. Levantar SQL Server (Docker)
```bash
docker compose up -d
```
Esto inicia SQL Server 2022 en el puerto **1433** y ejecuta `database/init.sql`, que crea la base `IncidenciasDB` con 5 incidencias de ejemplo.

**Conexión desde SSMS:**

| Campo | Valor |
|---|---|
| Server name | `localhost,1433` |
| Authentication | SQL Server Authentication |
| Login | `sa` |
| Password | `Incidencias#2026` |
| Opciones | Marcar *Trust server certificate* |

### 3. Iniciar la API
```bash
cd backend
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm start                 # http://localhost:3000/api/health
```

### 4. Iniciar Angular (en otra terminal, desde la raíz del proyecto)
```bash
npm install
ng serve                  # http://localhost:4200
```

> Si se omiten los pasos 2 y 3, la aplicación funciona igual en **modo local** con localStorage (el indicador superior muestra "Modo local").

---

## Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado de la conexión a la BD |
| GET | `/api/incidencias?q=&prioridad=&estado=&activo=1\|0\|todos` | Listar (por defecto solo activas) |
| GET | `/api/incidencias/:id` | Obtener una incidencia |
| POST | `/api/incidencias` | Registrar |
| PUT | `/api/incidencias/:id` | Actualizar |
| DELETE | `/api/incidencias/:id` | Eliminar (lógico): pasa a **Inactivo** |
| PATCH | `/api/incidencias/:id/restaurar` | Restaurar: vuelve a **Activo** |
| DELETE | `/api/incidencias/:id/definitivo` | Eliminar definitivamente (solo inactivas) |

---

## Enlaces

- **Repositorio:** https://github.com/jorgevilcapuma/S12_AP4_Incidencias_Jorge
- **Video de sustentación:** _(agregar enlace)_

## Tecnologías

Angular 19 · TypeScript · Signals · Reactive Forms · SCSS · Node.js · Express 5 · mssql · SQL Server 2022 · Docker
