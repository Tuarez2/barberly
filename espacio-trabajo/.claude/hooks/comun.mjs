// Utilidades compartidas por los hooks de seguridad.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ENVOLTORIOS = new Set(['sudo', 'env', 'command', 'nohup', 'time', 'exec', 'xargs', 'nice', 'timeout', '{', '!', 'if', 'then', 'do', 'else', 'while']);
const INICIO_HEREDOC = /^<<(-?)\s*(?:'([^']*)'|"([^"]*)"|([^\s;&|<>()]+))/;

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

// Posicion del cierre de una sustitucion $(...) o `...` que empieza en inicio.
function finSustitucion(comando, inicio) {
  if (comando[inicio] === '`') {
    const fin = comando.indexOf('`', inicio + 1);
    return fin === -1 ? comando.length : fin;
  }
  let profundidad = 0;
  for (let i = inicio + 1; i < comando.length; i += 1) {
    if (comando[i] === '(') profundidad += 1;
    else if (comando[i] === ')' && (profundidad -= 1) === 0) return i;
  }
  return comando.length;
}

// Guarda en cuerpos el texto de cada heredoc pendiente; devuelve donde sigue el comando.
function leerHeredocs(comando, inicio, pendientes, cuerpos) {
  let posicion = inicio;
  for (const { delimitador, sinTabs } of pendientes) {
    const lineas = [];
    while (posicion < comando.length) {
      const salto = comando.indexOf('\n', posicion);
      const fin = salto === -1 ? comando.length : salto;
      const linea = comando.slice(posicion, fin);
      posicion = fin + 1;
      if ((sinTabs ? linea.replace(/^\t+/, '') : linea) === delimitador) break;
      lineas.push(linea);
    }
    cuerpos.push(lineas.join('\n'));
  }
  return posicion;
}

// Divide en comandos simples respetando comillas. Cada comando trae sus tokens y, aparte,
// los destinos de sus redirecciones. Los heredocs y las sustituciones entre comillas dobles
// no se mezclan con los tokens: quien llama decide si analizarlos.
export function dividir(comando) {
  const comandos = [];
  const heredocs = [];
  const sustituciones = [];
  const nuevoComando = () => ({ tokens: [], entradas: [], salidas: [] });
  let actual = nuevoComando();
  let pendientes = [];
  let destino = null;
  let token = '';
  let hayToken = false;
  let comilla = null;
  const cerrarToken = () => {
    if (hayToken) {
      actual[destino ?? 'tokens'].push(token);
      destino = null;
    }
    token = '';
    hayToken = false;
  };
  const cerrarComando = () => {
    cerrarToken();
    destino = null;
    if (actual.tokens.length + actual.entradas.length + actual.salidas.length > 0) comandos.push(actual);
    actual = nuevoComando();
  };
  for (let i = 0; i < comando.length; i += 1) {
    const c = comando[i];
    if (comilla) {
      if (c === comilla) comilla = null;
      else if (comilla === '"' && c === '\\') token += comando[(i += 1)] ?? '';
      else if (comilla === '"' && (c === '`' || comando.startsWith('$(', i))) {
        const fin = finSustitucion(comando, i);
        sustituciones.push(comando.slice(i + (c === '`' ? 1 : 2), fin));
        i = fin;
      } else token += c;
    } else if (c === "'" || c === '"') {
      comilla = c;
      hayToken = true;
    } else if (c === '\\') {
      if (comando[i + 1] === '\n') i += 1;
      else {
        token += comando[(i += 1)] ?? '';
        hayToken = true;
      }
    } else if (c === '#' && !hayToken) {
      const salto = comando.indexOf('\n', i);
      i = (salto === -1 ? comando.length : salto) - 1;
    } else if (comando.startsWith('<<<', i)) {
      cerrarToken();
      destino = 'entradas';
      i += 2;
    } else if (comando.startsWith('<<', i)) {
      cerrarToken();
      const m = INICIO_HEREDOC.exec(comando.slice(i));
      if (m) {
        const delimitador = m[2] ?? m[3] ?? m[4].replaceAll('\\', '');
        pendientes.push({ delimitador, sinTabs: m[1] === '-' });
        i += m[0].length - 1;
      }
    } else if (c === '\n') {
      cerrarComando();
      if (pendientes.length > 0) {
        i = leerHeredocs(comando, i + 1, pendientes, heredocs) - 1;
        pendientes = [];
      }
    } else if (';|&()`'.includes(c)) {
      cerrarComando();
    } else if (/\s/.test(c)) {
      cerrarToken();
    } else if (c === '<' || c === '>') {
      if (/^\d+$/.test(token)) {
        token = '';
        hayToken = false;
      } else cerrarToken();
      destino = c === '<' ? 'entradas' : 'salidas';
    } else if (!(c === '$' && comando[i + 1] === '(')) {
      token += c;
      hayToken = true;
    }
  }
  cerrarComando();
  return { comandos, heredocs, sustituciones };
}

export function sinEnvoltorios(tokens) {
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
