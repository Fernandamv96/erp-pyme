/* ==========================================================
   INICIO DE SESIÓN
   Una sola clave de administrador (ADMIN_PASSWORD). Al entrar,
   el servidor entrega una cookie firmada con SESSION_SECRET que
   el navegador no puede leer ni modificar (HttpOnly).
   Si cambias ADMIN_PASSWORD, todas las sesiones abiertas se cierran.
   ========================================================== */
import crypto from "node:crypto";
import * as db from "./db.js";

const COOKIE = "erp_sesion";
const DURACION_MS = 8 * 60 * 60 * 1000; // 8 horas
const MAX_INTENTOS = 5;                 // intentos fallidos permitidos...
const VENTANA_MIN = 15;                 // ...cada 15 minutos por IP

export function revisarConfiguracion() {
  const faltan = [];
  if ((process.env.ADMIN_PASSWORD || "").length < 12) faltan.push("ADMIN_PASSWORD (mínimo 12 caracteres)");
  if ((process.env.SESSION_SECRET || "").length < 32) faltan.push("SESSION_SECRET (mínimo 32 caracteres)");
  return faltan;
}

const llave = () => crypto.createHmac("sha256", process.env.SESSION_SECRET).update(process.env.ADMIN_PASSWORD).digest();
const firmar = texto => crypto.createHmac("sha256", llave()).update(texto).digest("base64url");

function igualesSeguro(a, b) {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function leerCookie(req) {
  const par = (req.headers.cookie || "").split(/;\s*/).find(c => c.startsWith(COOKIE + "="));
  return par ? decodeURIComponent(par.slice(COOKIE.length + 1)) : "";
}

export function sesionValida(req) {
  if (revisarConfiguracion().length) return false;
  const [vence, firma] = leerCookie(req).split(".");
  if (!vence || !firma || !igualesSeguro(firma, firmar(vence))) return false;
  return Number(vence) > Date.now();
}

function opcionesCookie(req, maxAge) {
  const segura = req.secure || Boolean(process.env.VERCEL);
  return [`Path=/`, `HttpOnly`, `SameSite=Strict`, `Max-Age=${maxAge}`, segura ? "Secure" : ""].filter(Boolean).join("; ");
}

function error(status, mensaje) {
  const e = new Error(mensaje);
  e.status = status;
  return e;
}

export async function iniciarSesion(req, res) {
  if (revisarConfiguracion().length) throw error(503, "El inicio de sesión no está configurado en el servidor.");
  const ip = req.ip || "desconocida";
  if (await db.intentosRecientes(ip, VENTANA_MIN) >= MAX_INTENTOS) {
    throw error(429, `Demasiados intentos. Espera ${VENTANA_MIN} minutos e inténtalo de nuevo.`);
  }
  const clave = typeof req.body?.clave === "string" ? req.body.clave : "";
  if (!igualesSeguro(clave, process.env.ADMIN_PASSWORD)) {
    await db.registrarIntento(ip);
    throw error(401, "Clave incorrecta.");
  }
  await db.borrarIntentos(ip);
  const vence = String(Date.now() + DURACION_MS);
  res.set("Set-Cookie", `${COOKIE}=${vence}.${firmar(vence)}; ${opcionesCookie(req, DURACION_MS / 1000)}`);
  res.json({ ok: true });
}

export function cerrarSesion(req, res) {
  res.set("Set-Cookie", `${COOKIE}=; ${opcionesCookie(req, 0)}`);
  res.status(204).end();
}

// Bloquea la API si no hay una sesión válida
export function exigirSesion(req, res, next) {
  if (sesionValida(req)) return next();
  res.status(401).json({ error: "Tu sesión expiró. Vuelve a ingresar." });
}

/* Protección extra contra CSRF: los cambios solo se aceptan si vienen
   desde este mismo sitio (además de la cookie SameSite=Strict). */
export function mismoOrigen(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origen = req.get("origin");
  if (origen) {
    let host;
    try { host = new URL(origen).host; } catch { host = ""; }
    if (host !== req.get("host")) return res.status(403).json({ error: "Origen no permitido." });
  }
  if (req.headers["content-length"] > 0 && !req.is("application/json")) {
    return res.status(415).json({ error: "Envía los datos como JSON." });
  }
  next();
}
