// Utilidades compartidas por los hooks de seguridad.
import { readFileSync } from 'node:fs';
import path from 'node:path';

export function bloquear(mensaje) {
  process.stderr.write(`${mensaje}\n`);
  process.exit(2);
}

export function leerEvento() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return bloquear('Hook: no pude leer el evento; bloqueo por seguridad.');
  }
}

export function raizProyecto(evento) {
  return path.resolve(process.env.CLAUDE_PROJECT_DIR ?? evento.cwd ?? process.cwd());
}

// Ruta normalizada y relativa a la raiz del repo; fuera del repo empieza por "..".
export function rutaRelativa(evento, ruta) {
  const raiz = raizProyecto(evento);
  const absoluta = path.resolve(evento.cwd ?? raiz, ruta.replaceAll('\\', '/'));
  return path.relative(raiz, absoluta).replaceAll('\\', '/');
}

export function esEnvProtegido(ruta) {
  const nombre = path.posix.basename(ruta.replaceAll('\\', '/'));
  return nombre.startsWith('.env') && !nombre.endsWith('.example');
}
