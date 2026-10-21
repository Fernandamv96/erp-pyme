/* ==========================================================
   API REST
   Todas las rutas empiezan con /api y exigen sesión iniciada
   (el inicio de sesión está en app.js y sesion.js)
   ========================================================== */
import { Router } from "express";
import * as db from "./db.js";
import { NOMBRES_MODULOS, ErrorValidacion, validar } from "./esquemas.js";

export const rutas = Router();

// Todos los datos de una vez (lo usa el panel al cargar)
rutas.get("/datos", async (req, res) => res.json(await db.todo()));

// Indicadores ya calculados (útil para reportes o integraciones)
rutas.get("/resumen", async (req, res) => res.json(await db.resumen()));

// Nombre de la empresa
rutas.put("/empresa", async (req, res) => {
  const nombre = String(req.body?.nombre ?? "").trim();
  if (!nombre) throw new ErrorValidacion("El nombre de la empresa no puede quedar vacío.");
  if (nombre.length > 80) throw new ErrorValidacion("El nombre admite como máximo 80 caracteres.");
  res.json({ empresa: await db.guardarEmpresa(nombre) });
});

// Volver a los datos de ejemplo (borra todo lo demás)
rutas.post("/restaurar", async (req, res) => res.json(await db.restaurarEjemplo()));

/* ---------- CRUD genérico para los 4 módulos ---------- */
function moduloValido(req) {
  const { modulo } = req.params;
  if (!NOMBRES_MODULOS.includes(modulo)) {
    const e = new Error(`El módulo "${modulo}" no existe. Usa: ${NOMBRES_MODULOS.join(", ")}.`);
    e.status = 404;
    throw e;
  }
  return modulo;
}

function idValido(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) throw new ErrorValidacion("El id debe ser un número entero positivo.");
  return id;
}

function noEncontrado() {
  const e = new Error("Registro no encontrado.");
  e.status = 404;
  return e;
}

rutas.get("/:modulo", async (req, res) => {
  res.json(await db.listar(moduloValido(req)));
});

rutas.get("/:modulo/:id", async (req, res) => {
  const fila = await db.obtener(moduloValido(req), idValido(req));
  if (!fila) throw noEncontrado();
  res.json(fila);
});

rutas.post("/:modulo", async (req, res) => {
  const modulo = moduloValido(req);
  const datos = validar(modulo, req.body ?? {}, { parcial: false });
  res.status(201).json(await db.crear(modulo, datos));
});

rutas.patch("/:modulo/:id", async (req, res) => {
  const modulo = moduloValido(req);
  const id = idValido(req);
  const datos = validar(modulo, req.body, { parcial: true });
  const fila = await db.actualizar(modulo, id, datos);
  if (!fila) throw noEncontrado();
  res.json(fila);
});

rutas.delete("/:modulo/:id", async (req, res) => {
  const modulo = moduloValido(req);
  if (!(await db.eliminar(modulo, idValido(req)))) throw noEncontrado();
  res.status(204).end();
});
