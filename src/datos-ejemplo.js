/* ==========================================================
   DATOS DE EJEMPLO
   Se cargan la primera vez que inicias el servidor y cuando
   usas "Restaurar ejemplo". Cámbialos por los de tu negocio.
   ========================================================== */

export const DATOS_EJEMPLO = {
  empresa: "Mi Empresa Demo",
  inventario: [
    { producto: "Café molido 250g", categoria: "Alimentos", stock: 42, minimo: 15, costo: 3800, precio: 6500 },
    { producto: "Té verde 20u",     categoria: "Alimentos", stock: 8,  minimo: 10, costo: 2100, precio: 4200 },
    { producto: "Taza cerámica",    categoria: "Hogar",     stock: 25, minimo: 8,  costo: 2900, precio: 5900 },
    { producto: "Vela aromática",   categoria: "Hogar",     stock: 3,  minimo: 6,  costo: 4300, precio: 8900 },
    { producto: "Polera algodón",   categoria: "Ropa",      stock: 19, minimo: 10, costo: 6100, precio: 12990 },
    { producto: "Gorro de lana",    categoria: "Ropa",      stock: 4,  minimo: 5,  costo: 3500, precio: 7490 }
  ],
  clientes: [
    { nombre: "Ana Torres",   email: "ana@ejemplo.cl",    ciudad: "Santiago",   telefono: "+56 9 1111 2222" },
    { nombre: "Luis Muñoz",   email: "luis@ejemplo.cl",   ciudad: "Valparaíso", telefono: "+56 9 3333 4444" },
    { nombre: "Camila Rojas", email: "camila@ejemplo.cl", ciudad: "Concepción", telefono: "+56 9 5555 6666" },
    { nombre: "Pedro Soto",   email: "pedro@ejemplo.cl",  ciudad: "Santiago",   telefono: "+56 9 7777 8888" }
  ],
  ventas: [
    { fecha: "2026-05-04", cliente: "Ana Torres",   producto: "Café molido 250g", cantidad: 3, precio: 6500,  canal: "Tienda" },
    { fecha: "2026-05-18", cliente: "Luis Muñoz",   producto: "Polera algodón",   cantidad: 2, precio: 12990, canal: "Web" },
    { fecha: "2026-06-02", cliente: "Camila Rojas", producto: "Taza cerámica",    cantidad: 4, precio: 5900,  canal: "Redes" },
    { fecha: "2026-06-21", cliente: "Pedro Soto",   producto: "Vela aromática",   cantidad: 2, precio: 8900,  canal: "Tienda" },
    { fecha: "2026-07-09", cliente: "Ana Torres",   producto: "Gorro de lana",    cantidad: 1, precio: 7490,  canal: "Web" },
    { fecha: "2026-07-25", cliente: "Luis Muñoz",   producto: "Café molido 250g", cantidad: 5, precio: 6500,  canal: "Marketplace" },
    { fecha: "2026-08-14", cliente: "Camila Rojas", producto: "Polera algodón",   cantidad: 1, precio: 12990, canal: "Tienda" },
    { fecha: "2026-09-03", cliente: "Pedro Soto",   producto: "Té verde 20u",     cantidad: 3, precio: 4200,  canal: "Redes" },
    { fecha: "2026-09-27", cliente: "Ana Torres",   producto: "Taza cerámica",    cantidad: 2, precio: 5900,  canal: "Web" },
    { fecha: "2026-10-10", cliente: "Luis Muñoz",   producto: "Vela aromática",   cantidad: 3, precio: 8900,  canal: "Tienda" }
  ],
  gastos: [
    { fecha: "2026-05-05", concepto: "Arriendo local",       categoria: "Arriendo",     monto: 350000 },
    { fecha: "2026-06-03", concepto: "Compra de mercadería", categoria: "Mercadería",   monto: 280000 },
    { fecha: "2026-06-10", concepto: "Publicidad redes",     categoria: "Marketing",    monto: 60000 },
    { fecha: "2026-07-02", concepto: "Sueldo ayudante",      categoria: "Remuneración", monto: 320000 },
    { fecha: "2026-08-01", concepto: "Cuentas básicas",      categoria: "Servicios",    monto: 85000 },
    { fecha: "2026-09-04", concepto: "Compra de mercadería", categoria: "Mercadería",   monto: 310000 },
    { fecha: "2026-10-02", concepto: "Arriendo local",       categoria: "Arriendo",     monto: 350000 }
  ]
};
