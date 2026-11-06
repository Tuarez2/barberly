// PreToolUse global (settings.json). Guardia de archivos y comandos peligrosos.
// El analisis de Bash es de mejor esfuerzo: no ve lo que un programa lea por dentro (node -e, python).
import path from 'node:path';
import { bloquear, esEnvProtegido, leerEvento, rutaRelativa } from './comun.mjs';

const SOLO_LECTURA_PARA_CLAUDE = new Set(['docs/DERCAS.md', '.claude/settings.json']);
const HERRAMIENTAS_DE_EDICION = new Set(['Edit', 'Write', 'MultiEdit']);
const ENVOLTORIOS = new Set(['sudo', 'env', 'command', 'nohup', 'time', 'exec', 'xargs', 'nice', 'timeout', '{', '!', 'if', 'then', 'do', 'else', 'while']);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash']);
const CON_PATRON = new Set(['grep', 'egrep', 'fgrep', 'rg', 'ag', 'ack', 'sed', 'awk', 'gawk']);
const COPIADORES = new Set(['cp', 'mv', 'scp', 'rsync']);
const LECTORES = new Set([
  ...CON_PATRON, ...COPIADORES,
  'cat', 'tac', 'nl', 'less', 'more', 'most', 'head', 'tail', 'bat', 'cut', 'sort', 'uniq', 'wc',
  'diff', 'cmp', 'comm', 'paste', 'strings', 'od', 'xxd', 'hexdump', 'base64', 'md5sum', 'sha256sum',
  'source', '.', 'vi', 'vim', 'nano', 'view', 'dd', 'jq', 'tee',
]);

// Divide en comandos simples respetando comillas; las redirecciones quedan como tokens "<" y ">".
function dividir(comando) {
  const comandos = [];
  let actual = [];
  let token = '';
  let hayToken = false;
  let comilla = null;
  const cerrarToken = () => {
    if (hayToken) actual.push(token);
    token = '';
    hayToken = false;
  };
  const cerrarComando = () => {
    cerrarToken();
    if (actual.length > 0) comandos.push(actual);
    actual = [];
  };
  for (let i = 0; i < comando.length; i += 1) {
    const c = comando[i];
    if (comilla) {
      if (c === comilla) comilla = null;
      else if (c === '\\' && comilla === '"') token += comando[(i += 1)] ?? '';
      else token += c;
    } else if (c === "'" || c === '"') {
      comilla = c;
      hayToken = true;
    } else if (c === '\\') {
      token += comando[(i += 1)] ?? '';
      hayToken = true;
    } else if (';|&\n()`'.includes(c)) {
      cerrarComando();
    } else if (/\s/.test(c)) {
      cerrarToken();
    } else if (c === '<' || c === '>') {
      cerrarToken();
      actual.push(c);
    } else if (!(c === '$' && comando[i + 1] === '(')) {
      token += c;
      hayToken = true;
    }
  }
  cerrarComando();
  return comandos;
}

function sinEnvoltorios(tokens) {
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    const esAsignacion = /^[A-Za-z_]\w*=/.test(t);
    const esOpcionDeEnvoltorio = i > 0 && (t.startsWith('-') || /^\d+[smhd]?$/.test(t));
    if (!ENVOLTORIOS.has(t) && !esAsignacion && !esOpcionDeEnvoltorio) break;
    i += 1;
  }
  return tokens.slice(i);
}

function rmPeligroso(args) {
  for (const a of args.slice(1)) {
    if (a === '--') return false;
    if (/^--(recursive|force)$/.test(a) || /^-[a-zA-Z]*[rRf]/.test(a)) return true;
  }
  return false;
}

function operandos(args) {
  const lista = [];
  for (let i = 1; i < args.length; i += 1) {
    if (args[i] === '>') i += 1;
    else if (args[i] !== '<' && !args[i].startsWith('-')) lista.push(args[i].replace(/^if=/, ''));
  }
  return lista;
}

function leeEnv(nombre, args) {
  if (!LECTORES.has(nombre)) return null;
  let lista = operandos(args);
  if (CON_PATRON.has(nombre)) lista = lista.slice(1);
  if (COPIADORES.has(nombre)) lista = lista.slice(0, -1);
  return lista.find(esEnvProtegido) ?? null;
}

function revisarSimple(tokens, nivel) {
  tokens.forEach((t, i) => {
    if (t === '<' && esEnvProtegido(tokens[i + 1] ?? '')) {
      bloquear(`Bloqueado: no se lee ${tokens[i + 1]}; solo los archivos .example.`);
    }
  });
  const args = sinEnvoltorios(tokens);
  if (args.length === 0) return;
  const nombre = path.posix.basename(args[0]);

  if (nombre === 'rm' && rmPeligroso(args)) {
    bloquear('Bloqueado: rm con -r, -R o -f no está permitido; borra archivos concretos sin esas opciones.');
  }
  if (nombre === 'git' && args.includes('reset') && args.includes('--hard')) {
    bloquear('Bloqueado: git reset --hard descarta cambios; pídeselo al usuario.');
  }
  const env = leeEnv(nombre, args);
  if (env) bloquear(`Bloqueado: no se lee ${env}; solo los archivos .example.`);

  if (nivel >= 3) return;
  const posicionC = args.findIndex((a) => /^-[a-z]*c$/.test(a));
  if (SHELLS.has(nombre) && posicionC > 0) revisarComando(args[posicionC + 1] ?? '', nivel + 1);
  if (nombre === 'eval') revisarComando(args.slice(1).join(' '), nivel + 1);
  const posicionExec = args.findIndex((a) => ['-exec', '-execdir', '-ok'].includes(a));
  if (nombre === 'find' && posicionExec > 0) revisarSimple(args.slice(posicionExec + 1), nivel + 1);
}

function revisarComando(comando, nivel = 0) {
  if (/\bdrop\s+(database|schema)\b/i.test(comando)) {
    bloquear('Bloqueado: DROP DATABASE no está permitido; pídeselo al usuario.');
  }
  for (const tokens of dividir(comando)) revisarSimple(tokens, nivel);
  if (nivel >= 3) return;
  // Sustituciones dentro de comillas dobles, que dividir() trata como texto.
  for (const m of comando.matchAll(/\$\(([^()]*)\)|`([^`]*)`/g)) revisarComando(m[1] ?? m[2], nivel + 1);
}

const evento = leerEvento();
const entrada = evento.tool_input ?? {};

if (typeof entrada.command === 'string') {
  revisarComando(entrada.command);
} else if (typeof entrada.file_path === 'string') {
  const ruta = rutaRelativa(evento, entrada.file_path);
  if (esEnvProtegido(ruta)) bloquear(`Bloqueado: ${ruta} es privado; solo se usan los archivos .example.`);
  if (HERRAMIENTAS_DE_EDICION.has(evento.tool_name) && SOLO_LECTURA_PARA_CLAUDE.has(ruta)) {
    bloquear(`Bloqueado: ${ruta} solo lo cambia el usuario a mano.`);
  }
}
process.exit(0);
