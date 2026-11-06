// PostToolUse global (settings.json). Formatea el archivo editado si ya existen las herramientas.
// Nunca bloquea: siempre sale con 0 y los errores van a stderr.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const EXTENSIONES = new Set(['.ts', '.tsx', '.js', '.mjs', '.json']);

function correr(binario, args, raiz) {
  const r = spawnSync(binario, args, { cwd: raiz, encoding: 'utf8', timeout: 30000 });
  if (r.error) process.stderr.write(`formatear: ${r.error.message}\n`);
  else if (r.status !== 0) process.stderr.write(r.stderr || r.stdout || `formatear: ${binario} salió con ${r.status}\n`);
}

try {
  const evento = JSON.parse(readFileSync(0, 'utf8'));
  const raiz = path.resolve(process.env.CLAUDE_PROJECT_DIR ?? evento.cwd ?? process.cwd());
  const archivo = evento.tool_input?.file_path;
  const prettier = path.join(raiz, 'node_modules/.bin/prettier');
  const eslint = path.join(raiz, 'node_modules/.bin/eslint');
  if (typeof archivo === 'string' && EXTENSIONES.has(path.extname(archivo)) && existsSync(prettier)) {
    correr(prettier, ['--write', archivo], raiz);
    if (existsSync(eslint)) correr(eslint, ['--fix', archivo], raiz);
  }
} catch (error) {
  process.stderr.write(`formatear: ${error.message}\n`);
}
process.exit(0);
