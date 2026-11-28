// Logica de barberias (AUT-10, HU-AUT-03, BUS-01 a BUS-04, HU-BUS-01, HU-BUS-03, D-07, D-13, D-31).
import { baseDatos } from '../../compartido/base-datos';
import { ahora } from '../../compartido/reloj';
import { Prisma } from '../../generado/prisma/client';
import type {
  BarberiaListada,
  BarberiaRegistrada,
  ConsultaBarberias,
  EntradaRegistroBarberia,
  RespuestaListadoBarberias,
} from './esquemas';

// Portada publica (§8.7). AlmacenArchivos aun no existe: la URL apunta a la ruta del almacen local
// (GET /api/v1/almacen/*). Se reemplaza por almacen.urlPublica(clave) cuando se implemente.
function urlPortada(clave: string | null): string | null {
  return clave === null
    ? null
    : `/api/v1/almacen/${clave.split('/').map(encodeURIComponent).join('/')}`;
}

// BUS-02: % y _ literales en ILIKE (se escapan con barra invertida, ESCAPE en la consulta).
function patronContiene(texto: string): string {
  return `%${texto.replace(/[\\%_]/g, '\\$&')}%`;
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
// - abierta en la zona horaria de cada barberia: horario general del dia (0 = domingo), apertura
//   inclusive, cierre y pausa exclusivos, y sin Bloqueo de toda la barberia que cubra el instante.
export async function listar(consulta: ConsultaBarberias): Promise<RespuestaListadoBarberias> {
  // El instante va como ISO 8601 con "Z" y ::timestamptz: no depende de como @prisma/adapter-pg
  // serializa un Date ni de la zona de la sesion; la hora local sale de AT TIME ZONE de la barberia.
  const instante = ahora();
  const instanteIso = instante.toISOString();
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
    SELECT b."id", b."nombre", b."direccion", b."archivoPortada",
      (
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
      ) AS "abierta"
    FROM "barberias" b
    CROSS JOIN LATERAL (
      SELECT (${instanteIso}::timestamptz AT TIME ZONE b."zonaHoraria") AS "momento"
    ) l
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
    urlPortada: urlPortada(fila.archivoPortada),
    abierta: fila.abierta,
  }));
  return {
    datos,
    meta: { pagina: consulta.pagina, limite: consulta.limite, total: conteo[0]?.total ?? 0 },
  };
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
