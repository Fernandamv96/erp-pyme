/* Página de inicio de sesión: envía la clave y vuelve a la página anterior */
const form = document.getElementById("formLogin");
const error = document.getElementById("error");
const boton = document.getElementById("btnEntrar");

// Solo se vuelve a páginas de este mismo sitio (evita redirecciones a otros dominios)
function destino() {
  const volver = new URLSearchParams(location.search).get("volver") || "/";
  return /^\/(?!\/)[\w\-/]*$/.test(volver) ? volver : "/";
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  error.textContent = "";
  boton.disabled = true;
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave: document.getElementById("clave").value })
    });
    if (res.ok) return location.replace(destino());
    const cuerpo = await res.json().catch(() => null);
    error.textContent = cuerpo?.error || `Error ${res.status}`;
  } catch (err) {
    error.textContent = "No hay conexión con el servidor.";
  }
  boton.disabled = false;
});
