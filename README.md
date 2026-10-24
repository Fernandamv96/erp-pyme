# ERP Pyme

[![Demo](https://img.shields.io/badge/demo-erp--pyme--rho.vercel.app-000?logo=vercel)](https://erp-pyme-rho.vercel.app)
![Node](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20%7C%20PGlite-4169E1?logo=postgresql&logoColor=white)
[![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-green)](LICENSE)

ERP sencillo para pymes, con **ventas, inventario, clientes y gastos**. Trae dos diseños, **Aurora Glass** y **Dock Neon**, que usan el mismo servidor y la misma base de datos.

**[▶ Ver demo](https://erp-pyme-rho.vercel.app)**. El acceso está protegido con una clave de administrador.

## Funcionalidades

- CRUD de los cuatro módulos: inventario, clientes, ventas y gastos, con validación por esquema en el servidor.
- Panel con indicadores calculados (`/api/resumen`) y datos de la empresa editables.
- Dos interfaces intercambiables sobre la misma API: `aurora.html` (glassmorphism) y `neon.html` (dock estilo neón).
- Botón para restaurar los datos de ejemplo.

## Stack

| Capa | Tecnología |
| --- | --- |
| Backend | Node.js 24 + Express 5 |
| Base de datos | PostgreSQL: [Neon](https://neon.tech) en producción y [PGlite](https://pglite.dev) en local (Postgres dentro de Node, sin instalar nada) |
| Frontend | HTML, CSS y JavaScript sin frameworks |
| Despliegue | Vercel (función en `api/index.js`, región `gru1`, São Paulo) |
| Tests | `node:test` (12 pruebas de la API) |

## Seguridad

- **Sesión firmada:** cookie `HttpOnly`, `SameSite=Strict` y `Secure` en producción, firmada con `SESSION_SECRET`. La clave se compara con `crypto.timingSafeEqual`.
- **Freno a la fuerza bruta:** máximo 5 intentos fallidos cada 15 minutos por IP.
- **Cabeceras:** CSP estricta (`script-src 'self'`), `X-Frame-Options: DENY`, `nosniff`, HSTS, `Permissions-Policy` y COOP. Express y `vercel.json` usan las mismas cabeceras, y `npm test` comprueba que coincidan.
- **Secretos fuera del código:** `ADMIN_PASSWORD`, `SESSION_SECRET` y `DATABASE_URL` se leen desde variables de entorno; `.env` está en `.gitignore`.
- **Solo local por defecto:** en tu computador el servidor escucha en `127.0.0.1` salvo que cambies `HOST`.

## Ejecutar en local

Requiere Node.js 24.

```bash
npm install
cp .env.example .env     # completa ADMIN_PASSWORD (12+ caracteres) y SESSION_SECRET (32+)
npm run dev              # http://localhost:3000
```

Si dejas `DATABASE_URL` vacío, los datos se guardan con PGlite en `data/pglite`. Otros comandos:

```bash
npm test                 # pruebas de la API
npm run reset            # vuelve a los datos de ejemplo
```

El archivo [`api.http`](api.http) tiene ejemplos de llamadas para la extensión REST Client de VS Code.

## API

Todas las rutas empiezan con `/api` y, salvo el login, exigen sesión iniciada.

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/login` · `/api/logout` | Inicia o cierra la sesión |
| GET | `/api/datos` | Todos los datos (los usa el panel al cargar) |
| GET | `/api/resumen` | Indicadores calculados |
| PUT | `/api/empresa` | Actualiza los datos de la empresa |
| GET · POST | `/api/:modulo` | Lista o crea (`inventario`, `clientes`, `ventas`, `gastos`) |
| GET · PATCH · DELETE | `/api/:modulo/:id` | Lee, actualiza o elimina un registro |
| POST | `/api/restaurar` | Restaura los datos de ejemplo |

## Despliegue en Vercel

1. Importa el repo en Vercel y crea una base de datos en Neon.
2. Define `ADMIN_PASSWORD`, `SESSION_SECRET` y `DATABASE_URL` en *Settings → Environment Variables*.
3. Cada *push* a `main` se publica automáticamente.

## Licencia

[MIT](LICENSE)
