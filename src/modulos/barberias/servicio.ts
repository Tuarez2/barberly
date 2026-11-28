// Logica de barberias (AUT-10, HU-AUT-03, BUS-01 a BUS-08, HU-BUS-01 a HU-BUS-03, D-07, D-13, D-31, D-32).
import { baseDatos } from '../../compartido/base-datos';
import { esquemaUuid } from '../../compartido/contrato';
import { ErrorNegocio } from '../../compartido/errores';
import { ahora } from '../../compartido/reloj';
import { urlPublicaArchivo } from '../../compartido/urls-archivos';
import { Prisma } from '../../generado/prisma/client';
import type {
  BarberiaListada,
  BarberiaRegistrada,
  BarberoBarberia,
  ConsultaBarberias,
  DetalleBarberia,
  EntradaRegistroBarberia,
  RespuestaBarberosBarberia,
  RespuestaListadoBarberias,
  RespuestaServiciosBarberia,
} from './esquemas';

// BUS-02: % y _ literales en ILIKE (se escapan con barra invertida, ESCAPE en la consulta).
function patronContiene(texto: string): string {
  return `%${texto.replace(/[\\%_]/g, '\\$&')}%`;
}

// Hora local de la barberia b en el instante dado: l."momento" (timestamp sin zona). El instante va
// como ISO 8601 con "Z" y ::timestamptz: no depende de como @prisma/adapter-pg serializa un Date ni
// de la zona de la sesion.
function sqlMomentoLocal(instanteIso: string): Prisma.Sql {
  return Prisma.sql`CROSS JOIN LATERAL (
      SELECT (${instanteIso}::timestamptz AT TIME ZONE b."zonaHoraria") AS "momento"
    ) l`;
}

// D-31, BUS-03: la barberia b (con l de sqlMomentoLocal) esta abierta en el instante: horario general
// del dia (0 = domingo), apertura inclusive, cierre y pausa exclusivos, y sin Bloqueo de toda la
// barberia que cubra el instante. Lo usan el listado y el detalle.
function sqlAbierta(instanteIso: string): Prisma.Sql {
  return Prisma.sql`(
        EXISTS (
          SELECT 1 FROM "horarios_atencion" h
          WHERE h."barberiaId" = b."id" AND h."perfilBarberoId" IS NULL
            AND h."diaSemana" = EXTRACT(DOW FROM l."momento")::int
            AND h."horaApertura"::time <= l."momento"::time
            AND l."momento"::time < h."horaCierre"::time
            AND NOT (
              h."inicioPausa" IS NOT NULL AND h."finPausa" IS NOT NULL
              AND h."inicioPausa"::time <= l."momento"::time
              AND l."momento"::time < h."finPausa"::time
            )
        )
        AND NOT EXISTS (
          SELECT 1 FROM "bloqueos" k
          WHERE k."barberiaId" = b."id" AND k."perfilBarberoId" IS NULL
            AND k."iniciaEn" <= ${instanteIso}::timestamptz AND ${instanteIso}::timestamptz < k."terminaEn"
        )
      )`;
}

interface FilaListado {
  id: string;
  nombre: string;
  direccion: string;
  archivoPortada: string | null;
  abierta: boolean;
}

// BUS-01 a BUS-04, D-07, D-31. Consultas etiquetadas (Prisma.sql, sin concatenar texto):
// - Solo activas y publicadas; el listado es publico, tambien para sus miembros (D-32).
// - q y servicio sin tildes ni mayusculas: unaccent en ambos lados con ILIKE.
// - abierta en la zona horaria de cada barberia (sqlAbierta).
export async function listar(consulta: ConsultaBarberias): Promise<RespuestaListadoBarberias> {
  const instanteIso = ahora().toISOString();
  const filtros: Prisma.Sql[] = [Prisma.sql`b."activo" AND b."publicada"`];
  if (consulta.q !== undefined) {
    filtros.push(
      Prisma.sql`unaccent(b."nombre") ILIKE unaccent(${patronContiene(consulta.q)}) ESCAPE '\\'`,
    );
  }
  if (consulta.servicio !== undefined) {
    filtros.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "servicios" s
      WHERE s."barberiaId" = b."id" AND s."activo"
        AND unaccent(s."nombre") ILIKE unaccent(${patronContiene(consulta.servicio)}) ESCAPE '\\'
    )`);
  }

  const candidatas = Prisma.sql`
    SELECT b."id", b."nombre", b."direccion", b."archivoPortada", ${sqlAbierta(instanteIso)} AS "abierta"
    FROM "barberias" b ${sqlMomentoLocal(instanteIso)}
    WHERE ${Prisma.join(filtros, ' AND ')}`;
  const soloAbiertas = consulta.abierta === true ? Prisma.sql`WHERE c."abierta"` : Prisma.empty;
  const desplazamiento = (consulta.pagina - 1) * consulta.limite;

  // BUS-04: unico orden por nombre, con desempate por id para que la paginacion sea estable.
  const [filas, conteo] = await baseDatos.$transaction([
    baseDatos.$queryRaw<FilaListado[]>`
      SELECT c.* FROM (${candidatas}) c ${soloAbiertas}
      ORDER BY c."nombre" ASC, c."id" ASC
      LIMIT ${consulta.limite} OFFSET ${desplazamiento}`,
    baseDatos.$queryRaw<{ total: number }[]>`
      SELECT count(*)::int AS "total" FROM (${candidatas}) c ${soloAbiertas}`,
  ]);

  const datos: BarberiaListada[] = filas.map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    direccion: fila.direccion,
    urlPortada: urlPublicaArchivo(fila.archivoPortada),
    abierta: fila.abierta,
  }));
  return {
    datos,
    meta: { pagina: consulta.pagina, limite: consulta.limite, total: conteo[0]?.total ?? 0 },
  };
}

const noEncontrado = () => new ErrorNegocio('NO_ENCONTRADO', 404, 'No encontramos esa barbería');

// El id de la ruta que no es UUID responde NO_ENCONTRADO (no DATOS_INVALIDOS), como contextoBarberia.
function idBarberia(id: string): string {
  const resultado = esquemaUuid.safeParse(id);
  if (!resultado.success) throw noEncontrado();
  return resultado.data.toLowerCase();
}

// D-07, D-32: visible si esta activa y publicada, o si el usuario tiene una membresia ACTIVO en ella
// (aunque este inactiva o sin publicar). La membresia en otra barberia no cuenta. Si no, 404.
async function barberiaVisible(id: string, usuarioId: string): Promise<string> {
  const barberia = await baseDatos.barberia.findFirst({
    where: {
      id: idBarberia(id),
      OR: [
        { activo: true, publicada: true },
        { membresias: { some: { usuarioId, estado: 'ACTIVO' } } },
      ],
    },
    select: { id: true },
  });
  if (!barberia) throw noEncontrado();
  return barberia.id;
}

interface FilaDetalle {
  id: string;
  nombre: string;
  descripcion: string | null;
  direccion: string;
  telefono: string;
  archivoPortada: string | null;
  publicada: boolean;
  activo: boolean;
  abierta: boolean;
  miembro: boolean;
  limiteCierres: Date | string;
}

// BUS-05, BUS-08, D-31, D-32. Una consulta etiquetada trae la barberia, abierta (sqlAbierta), si el
// usuario es miembro ACTIVO y el fin de la ventana de cierres: inicio del dia local siguiente al
// ultimo dia reservable (hoy local + diasMaxAnticipacion, inclusive, como reservas D5).
export async function detalle(id: string, usuarioId: string): Promise<DetalleBarberia> {
  const barberiaId = idBarberia(id);
  const instante = ahora();
  const instanteIso = instante.toISOString();
  const [fila] = await baseDatos.$queryRaw<FilaDetalle[]>`
    SELECT b."id", b."nombre", b."descripcion", b."direccion", b."telefono", b."archivoPortada",
      b."publicada", b."activo", ${sqlAbierta(instanteIso)} AS "abierta",
      EXISTS (
        SELECT 1 FROM "membresias" m
        WHERE m."barberiaId" = b."id" AND m."usuarioId" = ${usuarioId}::uuid AND m."estado" = 'ACTIVO'
      ) AS "miembro",
      (
        (date_trunc('day', l."momento") + make_interval(days => b."diasMaxAnticipacion" + 1))
        AT TIME ZONE b."zonaHoraria"
      ) AS "limiteCierres"
    FROM "barberias" b ${sqlMomentoLocal(instanteIso)}
    WHERE b."id" = ${barberiaId}::uuid`;
  if (!fila || !(fila.miembro || (fila.activo && fila.publicada))) throw noEncontrado();

  const [horarios, bloqueos] = await Promise.all([
    // Solo el horario general (perfilBarberoId nulo); los dias sin fila no atienden.
    baseDatos.horarioAtencion.findMany({
      where: { barberiaId: fila.id, perfilBarberoId: null },
      orderBy: { diaSemana: 'asc' },
      select: {
        diaSemana: true,
        horaApertura: true,
        horaCierre: true,
        inicioPausa: true,
        finPausa: true,
      },
    }),
    // Bloqueos de toda la barberia que no terminaron y empiezan dentro de la ventana; sin motivo.
    baseDatos.bloqueo.findMany({
      where: {
        barberiaId: fila.id,
        perfilBarberoId: null,
        terminaEn: { gt: instante },
        iniciaEn: { lt: new Date(fila.limiteCierres) },
      },
      orderBy: [{ iniciaEn: 'asc' }, { id: 'asc' }],
      select: { iniciaEn: true, terminaEn: true },
    }),
  ]);

  const datos: DetalleBarberia = {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    direccion: fila.direccion,
    telefono: fila.telefono,
    urlPortada: urlPublicaArchivo(fila.archivoPortada),
    abierta: fila.abierta,
    horarios,
    cierres: bloqueos.map((bloqueo) => ({
      iniciaEn: bloqueo.iniciaEn.toISOString(),
      terminaEn: bloqueo.terminaEn.toISOString(),
    })),
  };
  // D-32: los miembros ACTIVO siempre reciben publicada y activo (la usa Gestion); el resto nunca.
  return fila.miembro ? { ...datos, publicada: fila.publicada, activo: fila.activo } : datos;
}

// BUS-06, HU-BUS-02, RN-21: servicios activos por nombre, sin paginar; precio como texto "25.00".
// Tambien el propietario ve solo los activos (los inactivos son de Gestion).
export async function listarServicios(
  id: string,
  usuarioId: string,
): Promise<RespuestaServiciosBarberia> {
  const barberiaId = await barberiaVisible(id, usuarioId);
  const servicios = await baseDatos.servicio.findMany({
    where: { barberiaId, activo: true },
    orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    select: { id: true, nombre: true, descripcion: true, precio: true, duracionMinutos: true },
  });
  const datos = servicios.map((servicio) => ({ ...servicio, precio: servicio.precio.toFixed(2) }));
  return { datos, meta: { total: datos.length } };
}

// BUS-07, RN-21: barberos con membresia ACTIVO y al menos un servicio activo, por nombreVisible y
// sin paginar. id es el PerfilBarbero; servicios son los ids activos ordenados por nombre del
// servicio. Sin correo, telefono, usuario ni membresia (RNF-17).
export async function listarBarberos(
  id: string,
  usuarioId: string,
): Promise<RespuestaBarberosBarberia> {
  const barberiaId = await barberiaVisible(id, usuarioId);
  const servicioActivo = { barberiaId, servicio: { barberiaId, activo: true } } as const;
  const perfiles = await baseDatos.perfilBarbero.findMany({
    where: {
      barberiaId,
      membresia: { barberiaId, estado: 'ACTIVO' },
      servicios: { some: servicioActivo },
    },
    orderBy: [{ nombreVisible: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      nombreVisible: true,
      archivoFoto: true,
      servicios: {
        where: servicioActivo,
        orderBy: [{ servicio: { nombre: 'asc' } }, { servicioId: 'asc' }],
        select: { servicioId: true },
      },
    },
  });
  const datos: BarberoBarberia[] = perfiles.map((perfil) => ({
    id: perfil.id,
    nombreVisible: perfil.nombreVisible,
    urlFoto: urlPublicaArchivo(perfil.archivoFoto),
    servicios: perfil.servicios.map((asignacion) => asignacion.servicioId),
  }));
  return { datos, meta: { total: datos.length } };
}

// RNF-17: select explicito.
const seleccionBarberia = {
  id: true,
  nombre: true,
  descripcion: true,
  direccion: true,
  telefono: true,
  publicada: true,
  activo: true,
} as const;

// D-13: barberia y membresia PROPIETARIO ACTIVO en una sola transaccion. Nace sin publicar (D-07);
// reglas, zona horaria y anticipo quedan con los valores por defecto del modelo.
export async function registrar(
  usuarioId: string,
  entrada: EntradaRegistroBarberia,
): Promise<BarberiaRegistrada> {
  return baseDatos.$transaction(async (tx) => {
    const barberia = await tx.barberia.create({
      data: {
        nombre: entrada.nombre,
        descripcion: entrada.descripcion ?? null,
        direccion: entrada.direccion,
        telefono: entrada.telefono,
        publicada: false,
        activo: true,
      },
      select: seleccionBarberia,
    });
    const membresia = await tx.membresia.create({
      data: { usuarioId, barberiaId: barberia.id, rol: 'PROPIETARIO', estado: 'ACTIVO' },
      select: { id: true, rol: true, estado: true },
    });
    return { ...barberia, membresia };
  });
}
