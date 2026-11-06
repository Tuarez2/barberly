// PreToolUse por agente. Uso: bash node.sh limitar-rutas.mjs <agente>
// Sin argumento toma agent_type del evento (respaldo en settings.json para context: fork);
// si no es un especialista, deja pasar. Mapa copiado de "Puedes tocar" en .claude/agents/.
// En Bash solo mira sed -i, tee y > o >>: es de mejor esfuerzo, el diff y el revisor son la red final.
import path from 'node:path';
import { bloquear, dividir, leerEvento, raizProyecto, rutaRelativa, sinEnvoltorios } from './comun.mjs';

const PRUEBA_API = /^(?!apps\/movil\/).*\.prueba\.ts$/;

const AGENTES = {
  'analista-spec': {
    permitidas: ['docs/especificaciones/', 'docs/reglas.md', 'docs/errores.md', 'docs/decisiones.md'],
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

function puedeEscribir(reglas, ruta) {
  const prohibida = (reglas.prohibidas ?? []).some((r) => coincide(ruta, r));
  return !prohibida && reglas.permitidas.some((r) => coincide(ruta, r));
}

function esTemporal(evento, ruta) {
  const absoluta = path.resolve(evento.cwd ?? raizProyecto(evento), ruta);
  return absoluta === '/dev/null' || absoluta === '/tmp' || absoluta.startsWith('/tmp/');
}

function archivosDeSed(args) {
  const operandos = [];
  let scriptEnOpcion = false;
  for (let i = 1; i < args.length; i += 1) {
    const a = args[i];
    if (/^(-[a-zA-Z]*[ef]|--expression|--file)$/.test(a)) {
      scriptEnOpcion = true;
      i += 1;
    } else if (/^--(expression|file)=/.test(a)) scriptEnOpcion = true;
    else if (!a.startsWith('-')) operandos.push(a);
  }
  return scriptEnOpcion ? operandos : operandos.slice(1);
}

function destinosDeEscritura({ tokens, salidas }) {
  const args = sinEnvoltorios(tokens);
  const nombre = path.posix.basename(args[0] ?? '');
  if (nombre === 'tee') return [...salidas, ...args.slice(1).filter((a) => !a.startsWith('-'))];
  if (nombre === 'sed' && args.some((a) => /^(-[a-zA-Z]*i|--in-place)/.test(a))) {
    return [...salidas, ...archivosDeSed(args)];
  }
  return salidas;
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
  if (!puedeEscribir(reglas, ruta)) bloquear(`${agente} no puede tocar ${ruta}; anótalo en Dudas`);
} else if (evento.tool_name === 'Read' && reglas.lecturaProhibida) {
  const motivo = reglas.lecturaProhibida[rutaRelativa(evento, String(entrada.file_path ?? ''))];
  if (motivo) bloquear(`${agente}: ${motivo}, no con Read`);
} else if (typeof entrada.command === 'string' && reglas.comandos) {
  const comando = entrada.command.trim();
  const permitido = reglas.comandos.some((r) => r.test(comando));
  if (!permitido || COMPOSICION.test(comando) || OPCION_PELIGROSA.test(comando)) {
    bloquear(`${agente} no puede ejecutar "${comando}"; anótalo en Dudas`);
  }
} else if (typeof entrada.command === 'string') {
  for (const simple of dividir(entrada.command).comandos) {
    for (const destino of destinosDeEscritura(simple)) {
      if (!esTemporal(evento, destino) && !puedeEscribir(reglas, rutaRelativa(evento, destino))) {
        bloquear(`${agente} no puede escribir en ${destino}; anótalo en Dudas`);
      }
    }
  }
}
process.exit(0);
