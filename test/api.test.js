/* Pruebas de la API: npm test
   Usan una base de datos temporal en memoria, así que no tocan tus datos reales. */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

process.env.DB_PATH = "memory://";
process.env.NODE_ENV = "test";
process.env.ADMIN_PASSWORD = "clave-de-prueba-123";
process.env.SESSION_SECRET = "secreto-de-prueba-con-mas-de-32-caracteres";
delete process.env.DATABASE_URL;

const { crearApp } = await import("../src/app.js");
const db = await import("../src/db.js");
const { CABECERAS_SEGURIDAD } = await import("../src/seguridad.js");

let servidor, base, cookie = "";

before(async () => {
  await db.inicializar();
  servidor = crearApp().listen(0);
  await new Promise(r => servidor.once("listening", r));
  base = `http://127.0.0.1:${servidor.address().port}/api`;
});

after(async () => {
  servidor.close();
  await db.cerrar();
});

async function llamar(ruta, method = "GET", body, { conCookie = true, headers = {} } = {}) {
  const res = await fetch(base + ruta, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(conCookie && cookie ? { Cookie: cookie } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = res.status === 204 ? null : await res.json();
  return { status: res.status, json, res };
}

test("sin sesión la API responde 401", async () => {
  assert.equal((await llamar("/datos")).status, 401);
  assert.equal((await llamar("/ventas", "POST", {})).status, 401);
  assert.equal((await llamar("/salud")).status, 200);
  assert.equal((await llamar("/sesion")).json.activa, false);
});

test("una cookie falsificada no sirve", async () => {
  const falsa = `erp_sesion=${Date.now() + 1e9}.firmaInventada`;
  assert.equal((await llamar("/datos", "GET", null, { headers: { Cookie: falsa } })).status, 401);
});

test("clave incorrecta: 401; clave correcta: entrega cookie segura", async () => {
  assert.equal((await llamar("/login", "POST", { clave: "otra" })).status, 401);
  const ok = await llamar("/login", "POST", { clave: process.env.ADMIN_PASSWORD });
  assert.equal(ok.status, 200);
  const setCookie = ok.res.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  cookie = setCookie.split(";")[0];
  assert.equal((await llamar("/sesion")).json.activa, true);
});

test("bloquea tras demasiados intentos fallidos", async () => {
  await db.borrarIntentos("127.0.0.1");
  await db.borrarIntentos("::ffff:127.0.0.1");
  for (let i = 0; i < 5; i++) await llamar("/login", "POST", { clave: "mala" }, { conCookie: false });
  const r = await llamar("/login", "POST", { clave: process.env.ADMIN_PASSWORD }, { conCookie: false });
  assert.equal(r.status, 429);
  await db.borrarIntentos("127.0.0.1");
  await db.borrarIntentos("::ffff:127.0.0.1");
});

test("rechaza cambios desde otro sitio (CSRF)", async () => {
  const r = await llamar("/ventas", "POST", {}, { headers: { Origin: "https://sitio-malicioso.com" } });
  assert.equal(r.status, 403);
});

test("envía cabeceras de seguridad, iguales a las de vercel.json", async () => {
  const { res } = await llamar("/salud");
  assert.match(res.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  const vercel = JSON.parse(fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const enVercel = Object.fromEntries(vercel.headers[0].headers.map(h => [h.key, h.value]));
  for (const [clave, valor] of Object.entries(CABECERAS_SEGURIDAD)) assert.equal(enVercel[clave], valor, clave);
});

test("carga los datos de ejemplo la primera vez", async () => {
  const { status, json } = await llamar("/datos");
  assert.equal(status, 200);
  assert.equal(json.empresa, "Mi Empresa Demo");
  assert.equal(json.ventas.length, 10);
  assert.equal(json.inventario.length, 6);
});

test("el resumen calcula ventas, gastos y stock bajo", async () => {
  const { json } = await llamar("/resumen");
  assert.equal(json.ventasTotales, 190960);
  assert.equal(json.gastosTotales, 1755000);
  assert.equal(json.resultado, -1564040);
  assert.equal(json.stockBajo.length, 3);
});

test("crear, editar y eliminar una venta", async () => {
  const creada = await llamar("/ventas", "POST", {});
  assert.equal(creada.status, 201);
  assert.equal(creada.json.canal, "Tienda");
  assert.equal(creada.json.cantidad, 1);
  assert.match(creada.json.fecha, /^\d{4}-\d{2}-\d{2}$/);

  const editada = await llamar(`/ventas/${creada.json.id}`, "PATCH", { cliente: "  Sofía  ", cantidad: 2, precio: 4990.4 });
  assert.equal(editada.status, 200);
  assert.equal(editada.json.cliente, "Sofía");
  assert.equal(editada.json.precio, 4990);

  assert.equal((await llamar(`/ventas/${creada.json.id}`, "DELETE")).status, 204);
  assert.equal((await llamar(`/ventas/${creada.json.id}`)).status, 404);
});

test("rechaza datos inválidos con un mensaje claro", async () => {
  const fila = (await llamar("/datos")).json.clientes[0];
  const malEmail = await llamar(`/clientes/${fila.id}`, "PATCH", { email: "no-es-email" });
  assert.equal(malEmail.status, 400);
  assert.match(malEmail.json.error, /email/);

  const venta = (await llamar("/datos")).json.ventas[0];
  assert.equal((await llamar(`/ventas/${venta.id}`, "PATCH", { cantidad: -3 })).status, 400);
  assert.equal((await llamar(`/ventas/${venta.id}`, "PATCH", { precio: 9e15 })).status, 400);
  assert.equal((await llamar(`/ventas/${venta.id}`, "PATCH", { canal: "Fax" })).status, 400);
  assert.equal((await llamar(`/ventas/${venta.id}`, "PATCH", { fecha: "2026-02-31" })).status, 400);
  assert.equal((await llamar("/ventas/99999999999")).status, 400);
  assert.equal((await llamar("/proveedores")).status, 404);
});

test("cambia el nombre de la empresa y restaura el ejemplo", async () => {
  assert.equal((await llamar("/empresa", "PUT", { nombre: "Café Luna" })).json.empresa, "Café Luna");
  assert.equal((await llamar("/empresa", "PUT", { nombre: "   " })).status, 400);
  const restaurado = await llamar("/restaurar", "POST");
  assert.equal(restaurado.json.empresa, "Mi Empresa Demo");
  assert.equal(restaurado.json.ventas[0].id, 1);
});

test("cerrar sesión borra la cookie", async () => {
  const r = await llamar("/logout", "POST");
  assert.equal(r.status, 204);
  assert.match(r.res.headers.get("set-cookie"), /Max-Age=0/);
});
