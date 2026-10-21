# ERP Pyme

ERP sencillo para pymes, con ventas, inventario, clientes y gastos. Trae dos diseños, **Aurora Glass** y **Dock Neon**, que usan el mismo servidor y la misma base de datos.

- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL. En producción (Vercel) se usa [Neon](https://neon.tech); en tu computador, si no configuras ninguna, se usa [PGlite](https://pglite.dev), un Postgres que corre dentro de Node, así que no hay que instalar nada aparte. Los datos locales quedan en la carpeta `data/pglite`.
- **Acceso:** protegido con una clave de administrador.

