// URL publica de una imagen (portada de barberia, foto del barbero; §8.7, skill almacen-archivos).
// AlmacenArchivos aun no existe: la URL apunta a la ruta del almacen local (GET /api/v1/almacen/*).
// Se reemplaza por almacen.urlPublica(clave) cuando se implemente. Nunca se expone la clave sola.
export function urlPublicaArchivo(clave: string | null): string | null {
  return clave === null
    ? null
    : `/api/v1/almacen/${clave.split('/').map(encodeURIComponent).join('/')}`;
}
