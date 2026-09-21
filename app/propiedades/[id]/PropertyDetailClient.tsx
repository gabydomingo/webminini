// ============================================================
//  ARCHIVO EN DESUSO — se puede borrar
// ============================================================
//  Acá vivía toda la ficha de propiedad como componente de cliente: traía
//  los datos con un useEffect, lo que significaba dos consultas a Supabase
//  por visita, sin caché, y una página vacía para Google.
//
//  Ahora esa lógica está repartida así:
//
//     page.tsx              → trae los datos en el servidor y arma el HTML
//     Galeria.tsx           → la galería y el visor a pantalla completa
//     FormularioConsulta.tsx→ el formulario de contacto
//     UbicacionMapa.tsx     → el mapa, cargado al llegar
//
//  Queda el archivo vacío nada más que porque el borrado hay que hacerlo
//  a mano. Se puede eliminar sin mirar atrás.
// ============================================================

export { };
