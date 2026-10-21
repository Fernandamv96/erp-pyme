/* ==========================================================
   ESQUEMA DE CADA MÓDULO
   Define qué campos tiene cada tabla, su tipo y sus reglas.
   Se usa para crear la base de datos y para validar todo lo
   que llega desde el navegador.
   ========================================================== */

export const CANALES = ["Tienda", "Web", "Redes", "Marketplace"];

export const MODULOS = {
  inventario: {
    producto:  { tipo: "texto", max: 120 },
    categoria: { tipo: "texto", max: 60 },
    stock:     { tipo: "numero" },
    minimo:    { tipo: "numero" },
    costo:     { tipo: "numero", entero: true },
    precio:    { tipo: "numero", entero: true }
  },
  clientes: {
    nombre:   { tipo: "texto", max: 120 },
    email:    { tipo: "email", max: 160 },
    telefono: { tipo: "texto", max: 40 },
    ciudad:   { tipo: "texto", max: 80 }
  },
  ventas: {
    fecha:    { tipo: "fecha" },
    cliente:  { tipo: "texto", max: 120 },
    producto: { tipo: "texto", max: 120 },
    cantidad: { tipo: "numero", defecto: 1 },
    precio:   { tipo: "numero", entero: true },
    canal:    { tipo: "lista", opciones: CANALES }
  },
  gastos: {
    fecha:     { tipo: "fecha" },
    concepto:  { tipo: "texto", max: 160 },
    categoria: { tipo: "texto", max: 60 },
    monto:     { tipo: "numero", entero: true }
  }
};

export const NOMBRES_MODULOS = Object.keys(MODULOS);

// Tope para cualquier número: cabe en una columna INTEGER de Postgres
const MAXIMO = 2_000_000_000;

export class ErrorValidacion extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.status = 400;
  }
}

export function hoy() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function valorPorDefecto(regla) {
  if ("defecto" in regla) return regla.defecto;
  if (regla.tipo === "numero") return 0;
  if (regla.tipo === "fecha") return hoy();
  if (regla.tipo === "lista") return regla.opciones[0];
  return "";
}

function fechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const d = new Date(texto + "T00:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === texto;
}

function limpiarCampo(campo, regla, valor) {
  switch (regla.tipo) {
    case "numero": {
      const n = typeof valor === "string" && valor.trim() === "" ? 0 : Number(valor);
      if (!Number.isFinite(n)) throw new ErrorValidacion(`"${campo}" debe ser un número.`);
      if (n < 0) throw new ErrorValidacion(`"${campo}" no puede ser negativo.`);
      if (n > MAXIMO) throw new ErrorValidacion(`"${campo}" es demasiado grande (máximo ${MAXIMO.toLocaleString("es-CL")}).`);
      return regla.entero ? Math.round(n) : Math.round(n * 1000) / 1000;
    }
    case "fecha": {
      const f = String(valor ?? "").trim();
      if (!fechaValida(f)) throw new ErrorValidacion(`"${campo}" debe ser una fecha válida (AAAA-MM-DD).`);
      return f;
    }
    case "lista": {
      if (!regla.opciones.includes(valor)) {
        throw new ErrorValidacion(`"${campo}" debe ser una de estas opciones: ${regla.opciones.join(", ")}.`);
      }
      return valor;
    }
    case "email": {
      const e = String(valor ?? "").trim();
      if (e.length > regla.max) throw new ErrorValidacion(`"${campo}" es demasiado largo.`);
      if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new ErrorValidacion(`"${e}" no parece un email válido.`);
      return e;
    }
    default: {
      const t = String(valor ?? "").trim();
      if (t.length > regla.max) throw new ErrorValidacion(`"${campo}" admite como máximo ${regla.max} caracteres.`);
      return t;
    }
  }
}

/**
 * Valida y limpia los datos recibidos para un módulo.
 * - parcial = false (crear): completa los campos faltantes con valores por defecto.
 * - parcial = true (editar): solo acepta los campos enviados.
 * Los campos que no existen en el esquema se ignoran.
 */
export function validar(modulo, cuerpo, { parcial = false } = {}) {
  const esquema = MODULOS[modulo];
  if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)) {
    throw new ErrorValidacion("El cuerpo de la solicitud debe ser un objeto JSON.");
  }
  const limpio = {};
  for (const [campo, regla] of Object.entries(esquema)) {
    if (campo in cuerpo) limpio[campo] = limpiarCampo(campo, regla, cuerpo[campo]);
    else if (!parcial) limpio[campo] = valorPorDefecto(regla);
  }
  if (parcial && Object.keys(limpio).length === 0) {
    throw new ErrorValidacion("No se envió ningún campo válido para actualizar.");
  }
  return limpio;
}
