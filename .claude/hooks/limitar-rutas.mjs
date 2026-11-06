// PreToolUse por agente. Uso: node limitar-rutas.mjs <agente>
// Sin argumento toma agent_type del evento (respaldo en settings.json para context: fork);
// si no es un especialista, deja pasar. Mapa copiado de "Puedes tocar" en .claude/agents/.
import { bloquear, leerEvento, rutaRelativa } from './comun.mjs';

const PRUEBA_API = /^(?!apps\/movil\/).*\.prueba\.ts$/;

const AGENTES = {
  'analista-spec': {
    permitidas: ['docs/especificaciones/', 'docs/reglas.md', 'docs/errores.md'],
    lecturaProhibida: { 'docs/DERCAS.md': 'lee el DERCAS con seccion-dercas.sh' },
    comandos: [/^bash \.claude\/skills\/especificar-sdd\/scripts\/seccion-dercas\.sh(\s|$)/],
  },
  'api-backend': {
    permitidas: [
      'apps/api/src/modulos/',
      'apps/api/src/tareas/',
      'apps/api/src/rutas.ts',
      'apps/api/src/compartido/',
      'apps/api/bruno/',
      'apps/api/README.md',
      'paquetes/compartido/',
    ],
    prohibidas: [/\.prueba\.tsx?$/],
  },
  'app-movil': { permitidas: ['apps/movil/', 'paquetes/compartido/'] },
  'base-datos': { permitidas: ['apps/api/prisma/', 'apps/api/src/compartido/base-datos.ts'] },
  pruebas: { permitidas: [PRUEBA_API, 'apps/api/src/pruebas/', 'pruebas/'] },
  'revisor-seguridad': {
    permitidas: [],
    comandos: [/^git (status|diff|log|ls-files)(\s|$)/],
  },
};

const HERRAMIENTAS_DE_EDICION = new Set(['Edit', 'Write', 'MultiEdit']);
const COMPOSICION = /[;&|<>`\n\r]|\$\(/;
const OPCION_PELIGROSA = /(^|\s)--(output|ext-diff)(=|\s|$)/;

function coincide(ruta, regla) {
  if (regla instanceof RegExp) return regla.test(ruta);
  return regla.endsWith('/') ? ruta.startsWith(regla) : ruta === regla;
}

const evento = leerEvento();
const agente = process.argv[2] ?? evento.agent_type;
const reglas = AGENTES[agente];

if (!reglas) {
  if (process.argv[2]) bloquear(`limitar-rutas: agente desconocido "${agente}".`);
  process.exit(0);
}

const entrada = evento.tool_input ?? {};

if (HERRAMIENTAS_DE_EDICION.has(evento.tool_name)) {
  const ruta = rutaRelativa(evento, String(entrada.file_path ?? ''));
  const prohibida = (reglas.prohibidas ?? []).some((r) => coincide(ruta, r));
  if (prohibida || !reglas.permitidas.some((r) => coincide(ruta, r))) {
    bloquear(`${agente} no puede tocar ${ruta}; anótalo en Dudas`);
  }
} else if (evento.tool_name === 'Read' && reglas.lecturaProhibida) {
  const motivo = reglas.lecturaProhibida[rutaRelativa(evento, String(entrada.file_path ?? ''))];
  if (motivo) bloquear(`${agente}: ${motivo}, no con Read`);
} else if (typeof entrada.command === 'string' && reglas.comandos) {
  const comando = entrada.command.trim();
  const permitido = reglas.comandos.some((r) => r.test(comando));
  if (!permitido || COMPOSICION.test(comando) || OPCION_PELIGROSA.test(comando)) {
    bloquear(`${agente} no puede ejecutar "${comando}"; anótalo en Dudas`);
  }
}
process.exit(0);
