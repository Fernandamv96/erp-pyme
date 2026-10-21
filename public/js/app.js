/* ==========================================================
   ERP PYME · LÓGICA DEL NAVEGADOR
   La comparten los dos diseños (Aurora Glass y Dock Neon).
   Los datos viven en el servidor: este archivo solo los pide
   y los envía a la API (/api).
   ========================================================== */

/* ==========================================================
   ESQUEMA VISUAL DE CADA MÓDULO (columnas de las tablas)
   Las reglas de validación están en el servidor (src/esquemas.js).
   ========================================================== */
const MODULOS = {
  ventas: {
    columnas: [
      { campo: "fecha", etiqueta: "Fecha", tipo: "fecha" },
      { campo: "cliente", etiqueta: "Cliente", tipo: "texto" },
      { campo: "producto", etiqueta: "Producto", tipo: "texto" },
      { campo: "cantidad", etiqueta: "Cantidad", tipo: "numero" },
      { campo: "precio", etiqueta: "Precio", tipo: "numero" },
      { campo: "total", etiqueta: "Total", tipo: "calculado" },
      { campo: "canal", etiqueta: "Canal", tipo: "lista", opciones: ["Tienda", "Web", "Redes", "Marketplace"] }
    ]
  },
  inventario: {
    columnas: [
      { campo: "producto", etiqueta: "Producto", tipo: "texto" },
      { campo: "categoria", etiqueta: "Categoría", tipo: "texto" },
      { campo: "stock", etiqueta: "Stock", tipo: "numero" },
      { campo: "minimo", etiqueta: "Stock mínimo", tipo: "numero" },
      { campo: "costo", etiqueta: "Costo", tipo: "numero" },
      { campo: "precio", etiqueta: "Precio venta", tipo: "numero" },
      { campo: "margen", etiqueta: "Margen", tipo: "calculado" }
    ]
  },
  clientes: {
    columnas: [
      { campo: "nombre", etiqueta: "Nombre", tipo: "texto" },
      { campo: "email", etiqueta: "Email", tipo: "texto" },
      { campo: "telefono", etiqueta: "Teléfono", tipo: "texto" },
      { campo: "ciudad", etiqueta: "Ciudad", tipo: "texto" }
    ]
  },
  gastos: {
    columnas: [
      { campo: "fecha", etiqueta: "Fecha", tipo: "fecha" },
      { campo: "concepto", etiqueta: "Concepto", tipo: "texto" },
      { campo: "categoria", etiqueta: "Categoría", tipo: "texto" },
      { campo: "monto", etiqueta: "Monto", tipo: "numero" }
    ]
  }
};

/* ==========================================================
   CONEXIÓN CON EL SERVIDOR
   ========================================================== */
let datos = { empresa: "", inventario: [], clientes: [], ventas: [], gastos: [] };
let vistaActual = "dashboard";
let filtro = "";
let conectado = false;

async function api(ruta, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch("/api" + ruta, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (e) {
    marcarConexion(false);
    throw new Error("No hay conexión con el servidor.");
  }
  marcarConexion(true);
  if (res.status === 401) {
    irAlLogin();
    throw new Error("Tu sesión expiró. Vuelve a ingresar.");
  }
  if (res.status === 204) return null;
  let cuerpo = null;
  try { cuerpo = await res.json(); } catch (e) {}
  if (!res.ok) throw new Error(cuerpo?.error || `Error ${res.status}`);
  return cuerpo;
}

function irAlLogin() {
  location.replace("/login?volver=" + encodeURIComponent(location.pathname));
}

async function cargar() {
  datos = await api("/datos");
}

function marcarConexion(ok) {
  conectado = ok;
  let aviso = document.getElementById("avisoServidor");
  if (ok) { if (aviso) aviso.remove(); return; }
  if (aviso) return;
  aviso = document.createElement("div");
  aviso.id = "avisoServidor";
  aviso.className = "aviso-servidor";
  aviso.setAttribute("role", "alert");
  aviso.innerHTML = location.protocol === "file:"
    ? "<strong>Abre el ERP desde el servidor.</strong> En VS Code ejecuta <code>npm start</code> y entra a <code>http://localhost:3000</code>."
    : "<strong>Sin conexión con el servidor.</strong> Revisa que siga corriendo (<code>npm start</code>) y recarga la página.";
  document.body.prepend(aviso);
}

/* ==========================================================
   UTILIDADES
   ========================================================== */
const pesos = n => { const v = Math.round(Number(n) || 0); return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("es-CL"); };
const numero = n => Number(n) || 0;
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function etiquetaMes(m) { const [a, mm] = m.split("-"); return (MESES[+mm - 1] || mm) + " " + String(a).slice(2); }
function nombreMes(m) { const [a, mm] = m.split("-"); const n = MESES_LARGOS[+mm - 1] || mm; return n.charAt(0).toUpperCase() + n.slice(1) + " " + a; }
function escapar(s) { return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function totalVenta(v) { return numero(v.cantidad) * numero(v.precio); }
function margenProducto(p) {
  const precio = numero(p.precio);
  return precio ? Math.round((precio - numero(p.costo)) / precio * 100) + "%" : "-";
}
const ICONO_BORRAR = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>';

let toastTimer;
function mostrarToast(texto, esError = false) {
  const t = document.getElementById("toast");
  t.textContent = texto;
  t.classList.toggle("error", esError);
  t.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("visible"), esError ? 3500 : 1400);
}
const avisarError = e => mostrarToast(e.message || "Algo salió mal.", true);

function animarNumero(el, valor, dinero) {
  const inicio = performance.now(), dur = 1100;
  function paso(t) {
    const p = Math.min(1, (t - inicio) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = dinero ? pesos(valor * e) : Math.round(valor * e).toLocaleString("es-CL");
    if (p < 1) requestAnimationFrame(paso);
  }
  requestAnimationFrame(paso);
}

function activarBarras(contenedor) {
  requestAnimationFrame(() => requestAnimationFrame(() => contenedor.classList.add("listo")));
}

function mesesConDatos() {
  return [...new Set([...datos.ventas.map(v => (v.fecha || "").slice(0, 7)),
                      ...datos.gastos.map(g => (g.fecha || "").slice(0, 7))])].filter(m => /^\d{4}-\d{2}$/.test(m)).sort();
}

/* ==========================================================
   PANEL GENERAL
   ========================================================== */
function renderPanel() {
  const ventasTotal = datos.ventas.reduce((s, v) => s + totalVenta(v), 0);
  const gastosTotal = datos.gastos.reduce((s, g) => s + numero(g.monto), 0);
  const utilidad = ventasTotal - gastosTotal;
  const bajoStock = datos.inventario.filter(p => numero(p.stock) <= numero(p.minimo));
  const ciudades = new Set(datos.clientes.map(c => (c.ciudad || "").trim()).filter(Boolean)).size;
  const ticket = datos.ventas.length ? ventasTotal / datos.ventas.length : 0;
  const meses = mesesConDatos();

  const sub = document.getElementById("subtitulo");
  if (sub) sub.textContent = meses.length ? (meses.length > 1 ? nombreMes(meses[0]) + " – " + nombreMes(meses[meses.length - 1]) : nombreMes(meses[0])) : "Sin movimientos aún";

  const kpis = [
    { label: "Ventas totales", valor: ventasTotal, dinero: true, cls: "k-ventas", nota: `${datos.ventas.length} ventas registradas` },
    { label: "Gastos totales", valor: gastosTotal, dinero: true, cls: "k-gastos", nota: `${datos.gastos.length} movimientos` },
    { label: "Resultado", valor: utilidad, dinero: true, cls: utilidad >= 0 ? "k-bueno" : "k-malo", nota: "Ventas menos gastos" },
    { label: "Clientes", valor: datos.clientes.length, dinero: false, cls: "k-neutro", nota: `${ciudades} ${ciudades === 1 ? "ciudad" : "ciudades"}` },
    { label: "Nº de ventas", valor: datos.ventas.length, dinero: false, cls: "k-neutro", nota: `Ticket prom. ${pesos(ticket)}` }
  ];
  const cont = document.getElementById("kpis");
  cont.innerHTML = kpis.map((k, i) => `
    <div class="kpi spot ${k.cls}" style="--i:${i}">
      <span class="kpi-label">${k.label}</span>
      <strong class="kpi-valor">0</strong>
      <small class="kpi-nota">${escapar(k.nota)}</small>
    </div>`).join("");
  cont.querySelectorAll(".kpi-valor").forEach((el, i) => animarNumero(el, kpis[i].valor, kpis[i].dinero));

  // Ventas y gastos por mes
  const ventasMes = meses.map(m => datos.ventas.filter(v => (v.fecha || "").startsWith(m)).reduce((s, v) => s + totalVenta(v), 0));
  const gastosMes = meses.map(m => datos.gastos.filter(g => (g.fecha || "").startsWith(m)).reduce((s, g) => s + numero(g.monto), 0));
  const maxMes = Math.max(1, ...ventasMes, ...gastosMes);
  const gm = document.getElementById("graficoMensual");
  gm.classList.remove("listo");
  gm.innerHTML = meses.length ? meses.map((m, i) => `
    <div class="col">
      <div class="par">
        <div class="bar b1" style="--h:${(ventasMes[i] / maxMes * 100).toFixed(1)}%" title="Ventas ${etiquetaMes(m)}: ${pesos(ventasMes[i])}"></div>
        <div class="bar b2" style="--h:${(gastosMes[i] / maxMes * 100).toFixed(1)}%" title="Gastos ${etiquetaMes(m)}: ${pesos(gastosMes[i])}"></div>
      </div>
      <span class="col-lbl">${etiquetaMes(m)}</span>
    </div>`).join("") : `<p class="vacio">Agrega ventas o gastos para ver este gráfico.</p>`;
  activarBarras(gm);

  // Gastos por categoría
  const cats = {};
  datos.gastos.forEach(g => { const c = (g.categoria || "").trim() || "Sin categoría"; cats[c] = (cats[c] || 0) + numero(g.monto); });
  const listaCats = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(1, ...listaCats.map(c => c[1]));
  const gg = document.getElementById("graficoGastos");
  gg.classList.remove("listo");
  gg.innerHTML = listaCats.length ? listaCats.map(([c, v]) => `
    <div class="hrow">
      <div class="hrow-top"><span>${escapar(c)}</span><strong>${pesos(v)}</strong></div>
      <div class="track"><div class="fill f2" style="--w:${(v / maxCat * 100).toFixed(1)}%"></div></div>
    </div>`).join("") : `<p class="vacio">Sin gastos registrados.</p>`;
  activarBarras(gg);

  // Productos más vendidos
  const prod = {};
  datos.ventas.forEach(v => { const p = (v.producto || "").trim() || "Sin nombre"; prod[p] = (prod[p] || 0) + numero(v.cantidad); });
  const top = Object.entries(prod).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxTop = Math.max(1, ...top.map(t => t[1]));
  const gp = document.getElementById("graficoProductos");
  gp.classList.remove("listo");
  gp.innerHTML = top.length ? top.map(([p, u], i) => `
    <div class="prow">
      <span class="prow-rank">${String(i + 1).padStart(2, "0")}</span>
      <span class="prow-nombre" title="${escapar(p)}">${escapar(p)}</span>
      <div class="track"><div class="fill f1" style="--w:${(u / maxTop * 100).toFixed(1)}%"></div></div>
      <strong class="prow-u">${u}</strong>
    </div>`).join("") : `<p class="vacio">Aún no hay ventas.</p>`;
  activarBarras(gp);

  // Alertas de stock
  const al = document.getElementById("alertas");
  al.classList.remove("listo");
  al.innerHTML = bajoStock.length
    ? bajoStock.map(p => {
        const pct = numero(p.minimo) ? Math.min(100, numero(p.stock) / numero(p.minimo) * 100) : 0;
        return `<button class="alerta" data-ir="inventario" data-buscar="${escapar(p.producto)}">
          <div class="alerta-top"><span>${escapar(p.producto)}</span><strong>${numero(p.stock)} / mín. ${numero(p.minimo)}</strong></div>
          <div class="track t-alerta"><div class="fill f3" style="--w:${pct.toFixed(0)}%"></div></div>
        </button>`;
      }).join("")
    : `<p class="ok">Todo el inventario está sobre el mínimo.</p>`;
  activarBarras(al);
}

// Clic en una alerta: abre Inventario filtrado por ese producto
document.getElementById("alertas").addEventListener("click", async e => {
  const b = e.target.closest("[data-ir]");
  if (!b) return;
  await cambiarVista(b.dataset.ir);
  filtro = b.dataset.buscar;
  document.getElementById("buscador").value = filtro;
  renderTabla();
});

/* ==========================================================
   TABLAS EDITABLES (genérico para los 4 módulos)
   ========================================================== */
function renderTabla() {
  const mod = MODULOS[vistaActual];
  document.getElementById("encabezados").innerHTML =
    mod.columnas.map(c => `<th class="${c.tipo === "numero" || c.tipo === "calculado" ? "num" : ""}">${c.etiqueta}</th>`).join("") +
    '<th class="acciones"><span class="sr">Acciones</span></th>';

  const filas = filasFiltradas();
  const cuerpo = document.getElementById("cuerpo");
  if (!filas.length) {
    cuerpo.innerHTML = `<tr><td colspan="${mod.columnas.length + 1}" class="sin-datos">${filtro ? "Nada coincide con la búsqueda." : 'Sin registros. Usa "Agregar fila".'}</td></tr>`;
  } else {
    cuerpo.innerHTML = filas.map(f => `
      <tr data-id="${f.id}" class="${claseFila(f)}">
        ${mod.columnas.map(c => celda(c, f)).join("")}
        <td class="acciones"><button class="btn-borrar" data-borrar="${f.id}" aria-label="Eliminar registro" title="Eliminar">${ICONO_BORRAR}</button></td>
      </tr>`).join("");
  }
  actualizarResumen();
}

function filasFiltradas() {
  const lista = datos[vistaActual];
  if (!filtro) return lista;
  const f = filtro.toLowerCase();
  const campos = MODULOS[vistaActual].columnas.map(c => c.campo);
  return lista.filter(r => campos.some(c => String(r[c] ?? "").toLowerCase().includes(f)));
}

function claseFila(f) {
  return vistaActual === "inventario" && numero(f.stock) <= numero(f.minimo) ? "fila-alerta" : "";
}

function valorCalculado(fila) {
  return vistaActual === "ventas" ? pesos(totalVenta(fila)) : margenProducto(fila);
}

function celda(col, fila) {
  const valor = fila[col.campo] ?? "";
  if (col.tipo === "calculado") return `<td class="num calc">${valorCalculado(fila)}</td>`;
  const ds = `data-id="${fila.id}" data-campo="${col.campo}" aria-label="${col.etiqueta}"`;
  if (col.tipo === "lista") {
    return `<td><select ${ds}>${col.opciones.map(o => `<option ${o === valor ? "selected" : ""}>${o}</option>`).join("")}</select></td>`;
  }
  if (col.tipo === "fecha") return `<td><input type="date" value="${escapar(valor)}" ${ds}></td>`;
  if (col.tipo === "numero") return `<td class="num"><input type="number" min="0" step="any" value="${escapar(valor)}" ${ds}></td>`;
  return `<td><input type="text" value="${escapar(valor)}" ${ds}></td>`;
}

function actualizarResumen() {
  const filas = filasFiltradas();
  let texto = `${filas.length} clientes`;
  if (vistaActual === "ventas") texto = `${filas.length} ventas · Total: ${pesos(filas.reduce((s, v) => s + totalVenta(v), 0))}`;
  if (vistaActual === "gastos") texto = `${filas.length} gastos · Total: ${pesos(filas.reduce((s, g) => s + numero(g.monto), 0))}`;
  if (vistaActual === "inventario") texto = `${filas.length} productos · ${filas.filter(p => numero(p.stock) <= numero(p.minimo)).length} con stock bajo`;
  document.getElementById("resumenTabla").textContent = texto;
}

// Edición en vivo: cada cambio de celda se guarda en el servidor
document.getElementById("cuerpo").addEventListener("change", async e => {
  const el = e.target;
  if (!el.dataset.campo) return;
  const modulo = vistaActual;
  const fila = datos[modulo].find(f => f.id == el.dataset.id);
  if (!fila) return;
  const col = MODULOS[modulo].columnas.find(c => c.campo === el.dataset.campo);
  const valor = col.tipo === "numero" ? numero(el.value) : el.value;
  const tr = el.closest("tr");
  try {
    const actualizada = await api(`/${modulo}/${fila.id}`, { method: "PATCH", body: { [col.campo]: valor } });
    Object.assign(fila, actualizada);
    mostrarToast("Cambios guardados");
  } catch (err) {
    avisarError(err);
  }
  // Refresca solo esta fila (así no se pierde el foco al pasar con Tab)
  if (vistaActual !== modulo || !tr.isConnected) return;
  el.value = fila[col.campo] ?? ""; // muestra lo que quedó guardado (o revierte si hubo error)
  const calc = tr.querySelector(".calc");
  if (calc) calc.textContent = valorCalculado(fila);
  tr.className = claseFila(fila);
  actualizarResumen();
});

// Eliminar fila
document.getElementById("cuerpo").addEventListener("click", async e => {
  const btn = e.target.closest("[data-borrar]");
  if (!btn) return;
  if (!confirm("¿Eliminar este registro?")) return;
  const modulo = vistaActual, id = Number(btn.dataset.borrar);
  try {
    await api(`/${modulo}/${id}`, { method: "DELETE" });
    datos[modulo] = datos[modulo].filter(f => f.id !== id);
    mostrarToast("Registro eliminado");
  } catch (err) {
    avisarError(err);
  }
  if (vistaActual === modulo) renderTabla();
});

// Agregar fila (el servidor completa los valores por defecto)
async function agregarFila() {
  const modulo = vistaActual;
  if (!MODULOS[modulo]) return;
  filtro = "";
  document.getElementById("buscador").value = "";
  try {
    const nueva = await api(`/${modulo}`, { method: "POST", body: {} });
    datos[modulo].push(nueva);
    mostrarToast("Fila agregada");
    if (vistaActual !== modulo) return;
    renderTabla();
    const tr = document.querySelector(`#cuerpo tr[data-id="${nueva.id}"]`);
    if (tr) {
      tr.classList.add("fila-nueva");
      tr.scrollIntoView({ block: "nearest", behavior: "smooth" });
      const primera = tr.querySelector('input[type="text"], input, select');
      if (primera) primera.focus();
    }
  } catch (err) {
    avisarError(err);
  }
}
document.getElementById("btnAgregar").addEventListener("click", agregarFila);

document.getElementById("buscador").addEventListener("input", e => {
  filtro = e.target.value;
  renderTabla();
});

/* ==========================================================
   NAVEGACIÓN, EXPORTAR, RESTAURAR Y NOMBRE DE EMPRESA
   ========================================================== */
const TITULOS = { dashboard: "Panel general", ventas: "Ventas", inventario: "Inventario", clientes: "Clientes", gastos: "Gastos" };

async function cambiarVista(v) {
  vistaActual = v;
  filtro = "";
  document.getElementById("buscador").value = "";
  document.querySelectorAll("[data-vista]").forEach(b => {
    const on = b.dataset.vista === v;
    b.classList.toggle("activo", on);
    if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  document.getElementById("titulo").textContent = TITULOS[v];
  document.getElementById("vista-dashboard").hidden = v !== "dashboard";
  document.getElementById("vista-tabla").hidden = v === "dashboard";
  const contenido = document.getElementById(v === "dashboard" ? "vista-dashboard" : "vista-tabla");
  contenido.classList.remove("entrar"); void contenido.offsetWidth; contenido.classList.add("entrar");
  // Trae los datos más recientes (por si otra persona los cambió)
  try { await cargar(); } catch (e) { /* se muestra el aviso de conexión */ }
  if (vistaActual === v) render();
}

function render() {
  document.getElementById("nombreEmpresa").textContent = datos.empresa || "Mi Empresa";
  if (vistaActual === "dashboard") renderPanel();
  else renderTabla();
}

document.querySelectorAll("[data-vista]").forEach(b => b.addEventListener("click", () => cambiarVista(b.dataset.vista)));

function descargarCSV(nombre, cabeceras, filas) {
  // Un texto que empieza con = + - @ se antepone con ' para que Excel no lo ejecute como fórmula
  const seguro = v => typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
  const lineas = [cabeceras, ...filas].map(f => f.map(v => `"${String(seguro(v)).replace(/"/g, '""')}"`).join(";"));
  const blob = new Blob(["﻿" + lineas.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  mostrarToast("CSV descargado");
}

document.getElementById("btnExportar").addEventListener("click", () => {
  if (vistaActual === "dashboard") {
    const filas = mesesConDatos().map(m => {
      const v = datos.ventas.filter(x => (x.fecha || "").startsWith(m)).reduce((s, x) => s + totalVenta(x), 0);
      const g = datos.gastos.filter(x => (x.fecha || "").startsWith(m)).reduce((s, x) => s + numero(x.monto), 0);
      return [m, v, g, v - g];
    });
    descargarCSV("resumen_mensual.csv", ["Mes", "Ventas", "Gastos", "Resultado"], filas);
    return;
  }
  const mod = MODULOS[vistaActual];
  const filas = datos[vistaActual].map(f => mod.columnas.map(c =>
    c.tipo === "calculado" ? (vistaActual === "ventas" ? totalVenta(f) : margenProducto(f)) : (f[c.campo] ?? "")));
  descargarCSV(`${vistaActual}.csv`, mod.columnas.map(c => c.etiqueta), filas);
});

document.getElementById("btnRestaurar").addEventListener("click", async () => {
  if (!confirm("Esto reemplaza TODOS los datos del servidor por los de ejemplo. ¿Continuar?")) return;
  try {
    datos = await api("/restaurar", { method: "POST" });
    mostrarToast("Datos de ejemplo restaurados");
    render();
  } catch (err) {
    avisarError(err);
  }
});

document.getElementById("btnNuevaVenta").addEventListener("click", async () => {
  await cambiarVista("ventas");
  agregarFila();
});

document.getElementById("nombreEmpresa").addEventListener("click", async () => {
  const nuevo = prompt("Nombre de tu empresa:", datos.empresa || "");
  if (!nuevo || !nuevo.trim()) return;
  try {
    const r = await api("/empresa", { method: "PUT", body: { nombre: nuevo.trim() } });
    datos.empresa = r.empresa;
    mostrarToast("Nombre actualizado");
    render();
  } catch (err) {
    avisarError(err);
  }
});

// Cerrar sesión: el botón se crea junto a "Restaurar" con el mismo estilo de cada diseño
const btnSalir = document.createElement("button");
btnSalir.className = document.getElementById("btnRestaurar").className;
btnSalir.id = "btnSalir";
btnSalir.textContent = "Salir";
document.getElementById("btnRestaurar").after(btnSalir);
btnSalir.addEventListener("click", async () => {
  try { await fetch("/api/logout", { method: "POST" }); } catch (e) {}
  irAlLogin();
});

/* ==========================================================
   EFECTO SPOTLIGHT (la luz sigue al mouse en las tarjetas)
   ========================================================== */
document.addEventListener("pointermove", e => {
  const el = e.target.closest && e.target.closest(".spot");
  if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--x", (e.clientX - r.left) + "px");
  el.style.setProperty("--y", (e.clientY - r.top) + "px");
});

// Inicio
cambiarVista("dashboard");
