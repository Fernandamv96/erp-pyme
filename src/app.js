/* ==========================================================
   APLICACIÓN EXPRESS
   Sirve la API (/api) y los dos diseños (carpeta public).
   En Vercel la carpeta public la sirve su CDN y este archivo
   solo atiende /api (ver api/index.js y vercel.json).
   ========================================================== */
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rutas } from "./rutas.js";
import { inicializar } from "./db.js";
import { iniciarSesion, cerrarSesion, sesionValida, exigirSesion, mismoOrigen } from "./sesion.js";
import { CABECERAS_SEGURIDAD } from "./seguridad.js";

const PUBLICO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

export function crearApp() {
  const app = express();
  app.disable("x-powered-by");
  // En Vercel la IP real del cliente llega en X-Forwarded-For (la pone Vercel)
  if (process.env.VERCEL) app.set("trust proxy", true);

  app.use((req, res, next) => {
    res.set(CABECERAS_SEGURIDAD);
    next();
  });
  app.use(express.json({ limit: "100kb" }));

  // Registro simple de cada llamada a la API en la terminal
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store"); // siempre datos frescos
    const inicio = Date.now();
    res.on("finish", () => {
      if (process.env.NODE_ENV !== "test") {
        console.log(`  ${req.method.padEnd(6)} ${req.originalUrl} → ${res.statusCode} (${Date.now() - inicio} ms)`);
      }
    });
    next();
  });

  app.use("/api", mismoOrigen);
  app.get("/api/salud", (req, res) => res.json({ ok: true, hora: new Date().toISOString() }));

  // Crea las tablas la primera vez (en Vercel, en cada arranque en frío)
  app.use("/api", async (req, res, next) => {
    await inicializar();
    next();
  });

  app.get("/api/sesion", (req, res) => res.json({ activa: sesionValida(req) }));
  app.post("/api/login", iniciarSesion);
  app.post("/api/logout", cerrarSesion);

  app.use("/api", exigirSesion, rutas);
  app.use("/api", (req, res) => res.status(404).json({ error: "Ruta de la API no encontrada." }));

  app.use(express.static(PUBLICO, { extensions: ["html"] }));

  // Manejo de errores: siempre responde JSON con un mensaje en español
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "El JSON enviado no es válido." });
    if (err.type === "entity.too.large") return res.status(413).json({ error: "La solicitud es demasiado grande." });
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 && status !== 503 ? "Error interno del servidor." : err.message });
  });

  return app;
}
