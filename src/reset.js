/* npm run reset → borra todo y vuelve a cargar los datos de ejemplo */
import { inicializar, restaurarEjemplo, cerrar, RUTA_DB } from "./db.js";

await inicializar();
await restaurarEjemplo();
await cerrar();
console.log(`Listo: se restauraron los datos de ejemplo en ${RUTA_DB}`);
