// PreToolUse global (settings.json). Guardia de archivos y comandos peligrosos.
// El analisis de Bash es de mejor esfuerzo: mira la palabra de comando de cada segmento e ignora
// cadenas y heredocs, salvo los .env (cualquier mencion) y los heredocs que van a un shell.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { bloquear, dividir, esEnvProtegido, leerEvento, rutaRelativa, sinEnvoltorios } from './comun.mjs';

const SOLO_LECTURA_PARA_CLAUDE = new Set(['docs/DERCAS.md', '.claude/settings.json']);
const HERRAMIENTAS_DE_EDICION = new Set(['Edit', 'Write', 'MultiEdit']);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash']);
const CLIENTES_SQL = new Set(['psql', 'pg_dump', 'pg_restore', 'dropdb', 'mysql', 'mariadb']);
const DROP_BASE = /\bdrop\s+(database|schema)\b/i;
// El caracter previo evita process.env y similares.
const MENCION_ENV = /(?:^|[^\w.-])(\.env[\w.-]*)/g;

function mencionEnv(texto) {
  for (const m of texto.matchAll(MENCION_ENV)) {
    const nombre = m[1].replace(/[.-]+$/, '');
    if (esEnvProtegido(nombre)) return nombre;
  }
  return null;
}

function nombreDe(args) {
  return path.posix.basename(args[0] ?? '');
}

function rmPeligroso(args) {
  for (const a of args.slice(1)) {
    if (a === '--') return false;
    if (/^--(recursive|force)$/.test(a) || /^-[a-zA-Z]*[rRf]/.test(a)) return true;
  }
  return false;
}

function ejecutaSql({ tokens }) {
  const args = sinEnvoltorios(tokens);
  const nombre = nombreDe(args);
  if (CLIENTES_SQL.has(nombre)) return true;
  const prisma = nombre === 'prisma' ? 0 : nombre === 'npx' ? args.indexOf('prisma') : -1;
  return prisma >= 0 && args[prisma + 1] === 'db' && args[prisma + 2] === 'execute';
}

function shellPorEntrada({ tokens }) {
  const args = sinEnvoltorios(tokens);
  return SHELLS.has(nombreDe(args)) && args.slice(1).every((a) => a.startsWith('-'));
}

// D-29: Claude hace commits, merges de tarea, push y PR; main solo recibe codigo por PR.
const OPCIONES_PUSH_PELIGROSAS = /^(-f|--force|--force-with-lease.*|--force-if-includes|--mirror|--delete|-d|--prune)$/;

function ramaActual(directorio) {
  const r = spawnSync('git', [...(directorio ? ['-C', directorio] : []), 'branch', '--show-current'], {
    cwd: evento.cwd ?? process.cwd(),
    encoding: 'utf8',
  });
  return r.status === 0 ? r.stdout.trim() : '';
}

function revisarGit(args) {
  const nombre = nombreDe(args);
  if (nombre === 'gh' && args[1] === 'pr' && args[2] === 'merge') {
    bloquear('Bloqueado: el PR lo fusiona el usuario en GitHub con el CI en verde (D-29).');
  }
  if (nombre !== 'git') return;
  let i = 1;
  let directorio;
  while (i < args.length && args[i].startsWith('-')) {
    if (args[i] === '-C') {
      directorio = args[i + 1];
      i += 2;
    } else if (args[i] === '-c') i += 2;
    else i += 1;
  }
  const subcomando = args[i];
  const resto = args.slice(i + 1);
  if (subcomando === 'push') {
    if (resto.some((a) => OPCIONES_PUSH_PELIGROSAS.test(a) || a.startsWith('+') || a.startsWith(':'))) {
      bloquear('Bloqueado: push forzado o que borra ramas remotas (D-29).');
    }
    if (resto.some((a) => /(^|:)(refs\/heads\/)?main$/.test(a)) || ramaActual(directorio) === 'main') {
      bloquear('Bloqueado: nunca push a main; el código entra por PR (D-29).');
    }
  }
  if ((subcomando === 'commit' || subcomando === 'merge') && ramaActual(directorio) === 'main') {
    bloquear(`Bloqueado: no se hace ${subcomando} en main; trabaja en la rama de la tarea (D-29).`);
  }
}

function revisarSimple(tokens, nivel) {
  const args = sinEnvoltorios(tokens);
  if (args.length === 0) return;
  const nombre = nombreDe(args);

  if (nombre === 'rm' && rmPeligroso(args)) {
    bloquear('Bloqueado: rm con -r, -R o -f no está permitido; borra archivos concretos sin esas opciones.');
  }
  if (nombre === 'git' && args.includes('reset') && args.includes('--hard')) {
    bloquear('Bloqueado: git reset --hard descarta cambios; pídeselo al usuario.');
  }
  revisarGit(args);

  if (nivel >= 3) return;
  const posicionC = args.findIndex((a) => /^-[a-z]*c$/.test(a));
  if (SHELLS.has(nombre) && posicionC > 0) revisarComando(args[posicionC + 1] ?? '', nivel + 1);
  if (nombre === 'eval') revisarComando(args.slice(1).join(' '), nivel + 1);
  const posicionExec = args.findIndex((a) => ['-exec', '-execdir', '-ok'].includes(a));
  if (nombre === 'find' && posicionExec > 0) revisarSimple(args.slice(posicionExec + 1), nivel + 1);
}

function revisarComando(comando, nivel = 0) {
  const { comandos, heredocs, sustituciones } = dividir(comando);
  for (const { tokens, entradas, salidas } of comandos) {
    const env = [...tokens, ...entradas, ...salidas].find(esEnvProtegido);
    if (env) bloquear(`Bloqueado: no se toca ${env}; solo los archivos .example.`);
    revisarSimple(tokens, nivel);
  }
  // El SQL puede llegar por -e, tuberia o heredoc: si hay cliente, se mira todo el texto.
  if (comandos.some(ejecutaSql) && DROP_BASE.test(comando)) {
    bloquear('Bloqueado: DROP DATABASE no está permitido; pídeselo al usuario.');
  }
  if (nivel >= 3) return;
  for (const sustitucion of sustituciones) revisarComando(sustitucion, nivel + 1);
  if (comandos.some(shellPorEntrada)) {
    for (const cuerpo of heredocs) revisarComando(cuerpo, nivel + 1);
  }
}

const evento = leerEvento();
const entrada = evento.tool_input ?? {};

if (typeof entrada.command === 'string') {
  const env = mencionEnv(entrada.command);
  if (env) bloquear(`Bloqueado: el comando menciona ${env}; solo se usan los archivos .example.`);
  revisarComando(entrada.command);
} else if (typeof entrada.file_path === 'string') {
  const ruta = rutaRelativa(evento, entrada.file_path);
  if (esEnvProtegido(ruta)) bloquear(`Bloqueado: ${ruta} es privado; solo se usan los archivos .example.`);
  if (HERRAMIENTAS_DE_EDICION.has(evento.tool_name) && SOLO_LECTURA_PARA_CLAUDE.has(ruta)) {
    bloquear(`Bloqueado: ${ruta} solo lo cambia el usuario a mano.`);
  }
}
process.exit(0);
