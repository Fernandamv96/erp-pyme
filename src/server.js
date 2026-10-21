/* ==========================================================
   PUNTO DE ENTRADA
   npm start  → inicia el servidor
   npm run dev → lo reinicia solo cada vez que guardas un archivo
   ========================================================== */
import { crearApp } from "./app.js";
import { inicializar, cerrar, RUTA_DB } from "./db.js";
import { revisarConfiguracion } from "./sesion.js";

const PUERTO = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const faltan = revisarConfiguracion();
if (faltan.length) {
  console.error(`\n  Falta configurar en el archivo .env: ${faltan.join(", ")}.`);
  console.error(`  Copia .env.example como .env y completa esos valores.\n`);
  process.exit(1);
}

await inicializar();

const servidor = crearApp().listen(PUERTO, HOST, () => {
  const base = `http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PUERTO}`;
  console.log("\n  ERP Pyme funcionando");
  console.log(`  ├─ Inicio:        ${base}`);
  console.log(`  ├─ Aurora Glass:  ${base}/aurora`);
  console.log(`  ├─ Dock Neon:     ${base}/neon`);
  console.log(`  ├─ API:           ${base}/api/datos`);
  console.log(`  └─ Base de datos: ${RUTA_DB}\n`);
});

servidor.on("error", err => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  El puerto ${PUERTO} ya está en uso. Cierra el otro programa o cambia PORT en el archivo .env\n`);
    process.exit(1);
  }
  throw err;
});

function apagar() {
  servidor.close(async () => {
    await cerrar();
    process.exit(0);
  });
}
process.on("SIGINT", apagar);
process.on("SIGTERM", apagar);
