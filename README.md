# ERP Pyme

ERP sencillo para pymes, con ventas, inventario, clientes y gastos. Trae dos diseños, **Aurora Glass** y **Dock Neon**, que usan el mismo servidor y la misma base de datos.

- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL. En producción (Vercel) se usa [Neon](https://neon.tech); en tu computador, si no configuras ninguna, se usa [PGlite](https://pglite.dev), un Postgres que corre dentro de Node, así que no hay que instalar nada aparte. Los datos locales quedan en la carpeta `data/pglite`.
- **Acceso:** protegido con una clave de administrador.

## Requisitos

- **Node.js 24** (también funciona con 22.13 o superior). Se recomienda la versión LTS, que se descarga en https://nodejs.org. Para ver qué versión tienes, ejecuta `node -v`.
- **Visual Studio Code.**

## Cómo iniciarlo en VS Code

1. Descomprime la carpeta y ábrela en VS Code con **Archivo → Abrir carpeta…**.
2. Abre la terminal con **Terminal → Nueva terminal** e instala las dependencias (solo la primera vez):
   ```
   npm install
   ```
3. Copia `.env.example` como `.env` y completa `ADMIN_PASSWORD` (la clave para entrar, mínimo 12 caracteres) y `SESSION_SECRET` (al azar, mínimo 32 caracteres; el mismo archivo explica cómo generarlo).
4. Inicia el servidor:
   ```
   npm run dev
   ```
   Con `dev`, el servidor se reinicia solo cada vez que guardas un archivo. Para dejarlo corriendo sin reinicios usa `npm start`.
5. Abre en el navegador e ingresa la clave:
   - http://localhost:3000 (inicio, para elegir el diseño)
   - http://localhost:3000/aurora
   - http://localhost:3000/neon

Para detener el servidor, presiona `Ctrl + C` en la terminal.

**Para depurar**, presiona `F5` y elige **"Iniciar ERP (con depurador)"**. Así puedes poner puntos de interrupción en los archivos de `src/`.

> Los archivos HTML ya no funcionan con doble clic, porque necesitan el servidor. Si los abres así, la página te avisa.

## Comandos

| Comando         | Qué hace                                              |
|-----------------|-------------------------------------------------------|
| `npm run dev`   | Inicia el servidor y lo reinicia al guardar cambios   |
| `npm start`     | Inicia el servidor normalmente                        |
| `npm test`      | Ejecuta las pruebas de la API (usa una base temporal en memoria) |
| `npm run reset` | Borra todo y vuelve a cargar los datos de ejemplo     |

## Estructura

```
erp-pyme/
├─ src/                    ← Backend
│  ├─ server.js            Punto de entrada (puerto, inicio)
│  ├─ app.js               Configuración de Express y manejo de errores
│  ├─ sesion.js            Inicio de sesión, cookie firmada y límite de intentos
│  ├─ seguridad.js         Cabeceras de seguridad (CSP, etc.)
│  ├─ rutas.js             Rutas de la API
│  ├─ db.js                Base de datos PostgreSQL / PGlite (tablas y consultas)
│  ├─ esquemas.js          Campos de cada módulo y sus validaciones
│  ├─ datos-ejemplo.js     Datos de ejemplo
│  └─ reset.js             Script de "npm run reset"
├─ public/                 ← Frontend
│  ├─ index.html           Página de inicio
│  ├─ login.html           Inicio de sesión
│  ├─ aurora.html          Diseño Aurora Glass
│  ├─ neon.html            Diseño Dock Neon
│  └─ js/                  app.js (lógica de los dos diseños) y login.js
├─ api/index.js            Función de Vercel (atiende /api)
├─ vercel.json             Rutas y cabeceras de seguridad en Vercel
├─ test/api.test.js        Pruebas
├─ api.http                Llamadas de ejemplo (extensión REST Client)
├─ .env.example            Configuración opcional
└─ data/pglite/            Tu base de datos local (se crea sola)
```

## API

Todas las rutas empiezan con `/api` y, salvo `/salud`, `/sesion`, `/login` y `/logout`, exigen haber iniciado sesión (si no, responden `401`). `:modulo` puede ser `ventas`, `inventario`, `clientes` o `gastos`.

| Método | Ruta               | Descripción                                    |
|--------|--------------------|------------------------------------------------|
| GET    | `/datos`           | Todos los datos y el nombre de la empresa      |
| GET    | `/resumen`         | Indicadores: totales, resultado, por mes, stock bajo |
| GET    | `/:modulo`         | Lista los registros de un módulo               |
| GET    | `/:modulo/:id`     | Un registro                                    |
| POST   | `/:modulo`         | Crea un registro (los campos que faltan toman valores por defecto) |
| PATCH  | `/:modulo/:id`     | Edita solo los campos enviados                 |
| DELETE | `/:modulo/:id`     | Elimina un registro                            |
| PUT    | `/empresa`         | Cambia el nombre: `{ "nombre": "..." }`        |
| POST   | `/restaurar`       | Vuelve a los datos de ejemplo                  |
| GET    | `/salud`           | Comprueba que el servidor responde             |
| GET    | `/sesion`          | `{ "activa": true/false }`                    |
| POST   | `/login`           | Inicia sesión: `{ "clave": "..." }`           |
| POST   | `/logout`          | Cierra la sesión                               |

Los errores siempre responden con `{ "error": "mensaje en español" }`. Por ejemplo, el servidor rechaza un email mal escrito, un número negativo, una fecha que no existe o un canal que no está en la lista. El navegador muestra ese mensaje y vuelve al valor anterior.

Si tienes instalada la extensión **REST Client**, puedes probar la API desde el archivo `api.http`.

## Configuración

Todo va en el archivo `.env` (cópialo desde `.env.example`):

- `ADMIN_PASSWORD` (obligatoria): la clave para entrar. Si la cambias, se cierran todas las sesiones abiertas.
- `SESSION_SECRET` (obligatoria): secreto al azar para firmar la sesión.
- `DATABASE_URL`: conexión a PostgreSQL (por ejemplo, Neon). Vacía = PGlite local en `data/pglite`.
- `PORT`: el puerto (por defecto, 3000).
- `HOST`: con `0.0.0.0` también pueden entrar otros equipos de la misma red, usando `http://IP-de-este-PC:3000`. Úsalo solo en una red de confianza: en local la conexión no va cifrada (sin HTTPS).

## Seguridad

- Toda la API exige sesión. La sesión es una cookie `HttpOnly`, `Secure` (en Vercel) y `SameSite=Strict`, firmada con HMAC y válida por 8 horas.
- Tras 5 claves incorrectas desde una misma IP, el ingreso se bloquea 15 minutos (se registra en la base, así funciona aunque Vercel use varias instancias).
- Los cambios (POST, PUT, PATCH, DELETE) solo se aceptan desde el mismo sitio (revisión del encabezado `Origin`) y en JSON.
- Cabeceras de seguridad: CSP sin scripts externos ni en línea, `X-Frame-Options: DENY`, `nosniff`, HSTS, etc. Están en `src/seguridad.js` y repetidas en `vercel.json`; `npm test` comprueba que coincidan.
- Todas las consultas SQL usan parámetros; los datos que se muestran en pantalla se escapan; al exportar CSV, los textos que empiezan con `=`, `+`, `-` o `@` se protegen para que Excel no los ejecute como fórmulas.
- Las claves y la conexión a la base viven solo en variables de entorno: nunca en el código.

## Despliegue en Vercel

1. Importa el repositorio en Vercel (no necesita comando de build; `vercel.json` ya define todo).
2. Agrega la integración de **Neon** desde el Marketplace de Vercel: crea `DATABASE_URL` sola.
3. En **Settings → Environment Variables**, agrega `ADMIN_PASSWORD` y `SESSION_SECRET` (como *Sensitive*).
4. Despliega. Las tablas y los datos de ejemplo se crean solos la primera vez.

## Respaldo

- **Local:** detén el servidor y copia la carpeta `data/pglite`.
- **Neon:** Neon guarda historial y permite restaurar a un punto anterior desde su panel; también puedes usar `pg_dump` con la `DATABASE_URL`.

## Cómo agregar un campo nuevo

Por ejemplo, para agregar "proveedor" al inventario:

1. En `src/esquemas.js`, agrégalo dentro de `inventario`: `proveedor: { tipo: "texto", max: 120 }`.
2. En `public/js/app.js`, agrega la columna dentro de `MODULOS.inventario.columnas`.
3. Las tablas ya existentes no se modifican solas. Ejecuta `npm run reset` (esto borra los datos) o agrega la columna a mano con `ALTER TABLE inventario ADD COLUMN proveedor TEXT NOT NULL DEFAULT ''`.
