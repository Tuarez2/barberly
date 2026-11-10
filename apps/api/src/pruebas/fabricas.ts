// Fabricas de datos para pruebas y semillas (skill pruebas-api, DERCAS §7.1).
// UUID fijos para que los fallos se puedan reproducir: los ids que no se pasan salen de un contador
// que se reinicia en limpiarBase, asi cada prueba genera la misma secuencia.
import bcrypt from 'bcryptjs';

import { baseDatos } from '../compartido/base-datos';
import type { EstadoCita } from '../generado/prisma/client';

export function idPrueba(numero: number): string {
  return `00000000-0000-4000-8000-${numero.toString().padStart(12, '0')}`;
}

export const IDS_PRUEBA = {
  usuario: idPrueba(1),
  propietario: idPrueba(101),
  propietarioOtra: idPrueba(102),
  barbero: idPrueba(103),
  barberoOtra: idPrueba(104),
  cliente: idPrueba(105),
  barberia: idPrueba(201),
  otraBarberia: idPrueba(202),
  perfilBarbero: idPrueba(301),
  perfilBarberoOtra: idPrueba(302),
  servicioCorte: idPrueba(401),
  servicioBarba: idPrueba(402),
  servicioOtra: idPrueba(403),
} as const;

// Solo para pruebas y desarrollo local; cumple §11.4 (letra, numero y 8 o mas caracteres).
export const CLAVE_PRUEBA = 'Barberly2026';
const COSTO_BCRYPT = 12; // DERCAS §14.3

let contador = 10_000;
function siguienteId(): string {
  contador += 1;
  return idPrueba(contador);
}

let hashCacheado: Promise<string> | undefined;
export function hashClavePrueba(): Promise<string> {
  hashCacheado ??= bcrypt.hash(CLAVE_PRUEBA, COSTO_BCRYPT);
  return hashCacheado;
}

// Borra en orden de dependencias. Solo para barberly_prueba y la base local de desarrollo.
export async function limpiarBase(): Promise<void> {
  contador = 10_000;
  await baseDatos.registroAuditoria.deleteMany();
  await baseDatos.pago.deleteMany();
  await baseDatos.consultaEstilo.deleteMany();
  await baseDatos.cita.deleteMany();
  await baseDatos.bloqueo.deleteMany();
  await baseDatos.horarioAtencion.deleteMany();
  await baseDatos.servicioBarbero.deleteMany();
  await baseDatos.servicio.deleteMany();
  await baseDatos.perfilBarbero.deleteMany();
  await baseDatos.membresia.deleteMany();
  await baseDatos.codigoRecuperacion.deleteMany();
  await baseDatos.tokenRenovacion.deleteMany();
  await baseDatos.barberia.deleteMany();
  await baseDatos.usuario.deleteMany();
}

interface DatosUsuario {
  id?: string;
  nombre?: string;
  correo: string;
  telefono?: string;
  activo?: boolean;
}

export async function crearUsuarioDePrueba(datos: DatosUsuario) {
  return baseDatos.usuario.create({
    data: {
      id: datos.id ?? siguienteId(),
      nombre: datos.nombre ?? 'Usuario de prueba',
      correo: datos.correo.toLowerCase(),
      telefono: datos.telefono ?? '0991234567',
      claveHash: await hashClavePrueba(),
      activo: datos.activo ?? true,
    },
  });
}

export const crearClienteDePrueba = crearUsuarioDePrueba;

interface DatosServicio {
  id?: string;
  nombre: string;
  precio: string;
  duracionMinutos: number;
  etiquetasEstilo?: string;
}

const SERVICIOS_BASE: DatosServicio[] = [
  {
    nombre: 'Corte clasico',
    precio: '8.00',
    duracionMinutos: 30,
    etiquetasEstilo: 'clasico,corto,ejecutivo',
  },
  { nombre: 'Barba', precio: '5.00', duracionMinutos: 30, etiquetasEstilo: 'barba,perfilado' },
];

interface DatosBarberia {
  id?: string;
  propietarioId: string;
  nombre?: string;
  servicios?: DatosServicio[];
  conHorario?: boolean;
}

// Crea la barberia, la membresia ACTIVO de su propietario, sus servicios y un horario general.
export async function crearBarberiaDePrueba(datos: DatosBarberia) {
  const barberia = await baseDatos.barberia.create({
    data: {
      id: datos.id ?? siguienteId(),
      nombre: datos.nombre ?? 'Barberia de prueba',
      direccion: 'Av. 9 de Octubre 100, Guayaquil',
      telefono: '042345678',
    },
  });
  await baseDatos.membresia.create({
    data: {
      id: siguienteId(),
      usuarioId: datos.propietarioId,
      barberiaId: barberia.id,
      rol: 'PROPIETARIO',
      estado: 'ACTIVO',
    },
  });
  const servicios = [];
  for (const servicio of datos.servicios ?? SERVICIOS_BASE) {
    servicios.push(
      await baseDatos.servicio.create({
        data: {
          id: servicio.id ?? siguienteId(),
          barberiaId: barberia.id,
          nombre: servicio.nombre,
          precio: servicio.precio,
          duracionMinutos: servicio.duracionMinutos,
          etiquetasEstilo: servicio.etiquetasEstilo ?? '',
        },
      }),
    );
  }
  if (datos.conHorario ?? true) {
    // Los 7 dias: la convencion de diaSemana 0 sigue abierta (Duda de disponibilidad-horarios).
    await baseDatos.horarioAtencion.createMany({
      data: [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => ({
        id: siguienteId(),
        barberiaId: barberia.id,
        diaSemana,
        horaApertura: '09:00',
        horaCierre: '19:00',
        inicioPausa: '13:00',
        finPausa: '14:00',
      })),
    });
  }
  return { barberia, servicios };
}

interface DatosBarbero {
  usuarioId: string;
  barberiaId: string;
  perfilId?: string;
  nombreVisible?: string;
  servicioIds: string[];
}

// Crea la membresia BARBERO ACTIVO, su PerfilBarbero y los servicios que ofrece.
export async function crearBarberoDePrueba(datos: DatosBarbero) {
  const membresia = await baseDatos.membresia.create({
    data: {
      id: siguienteId(),
      usuarioId: datos.usuarioId,
      barberiaId: datos.barberiaId,
      rol: 'BARBERO',
      estado: 'ACTIVO',
    },
  });
  const perfil = await baseDatos.perfilBarbero.create({
    data: {
      id: datos.perfilId ?? siguienteId(),
      membresiaId: membresia.id,
      barberiaId: datos.barberiaId,
      nombreVisible: datos.nombreVisible ?? 'Barbero de prueba',
    },
  });
  await baseDatos.servicioBarbero.createMany({
    data: datos.servicioIds.map((servicioId) => ({
      perfilBarberoId: perfil.id,
      servicioId,
      barberiaId: datos.barberiaId,
    })),
  });
  return { membresia, perfil };
}

interface DatosCita {
  barberiaId: string;
  perfilBarberoId: string;
  servicioId: string;
  iniciaEn: Date;
  clienteId?: string | null;
  nombreCliente?: string;
  telefonoCliente?: string;
  estado?: EstadoCita;
}

// Congela precio y duracion del servicio (RN-02, RN-03); terminaEn = iniciaEn + duracion.
export async function crearCitaDePrueba(datos: DatosCita) {
  const servicio = await baseDatos.servicio.findUniqueOrThrow({ where: { id: datos.servicioId } });
  return baseDatos.cita.create({
    data: {
      id: siguienteId(),
      barberiaId: datos.barberiaId,
      clienteId: datos.clienteId === undefined ? IDS_PRUEBA.cliente : datos.clienteId,
      nombreCliente: datos.nombreCliente,
      telefonoCliente: datos.telefonoCliente,
      perfilBarberoId: datos.perfilBarberoId,
      servicioId: datos.servicioId,
      iniciaEn: datos.iniciaEn,
      terminaEn: new Date(datos.iniciaEn.getTime() + servicio.duracionMinutos * 60_000),
      precioReserva: servicio.precio,
      duracionReserva: servicio.duracionMinutos,
      estado: datos.estado ?? 'CONFIRMADA',
    },
  });
}

// Dos barberias publicadas, cada una con su propietario, un barbero y servicios; mas un cliente.
// La segunda existe para las pruebas de aislamiento (recurso ajeno → 404).
export async function escenarioBase() {
  await crearUsuarioDePrueba({
    id: IDS_PRUEBA.propietario,
    nombre: 'Propietario',
    correo: 'propietario@barberly.test',
  });
  await crearUsuarioDePrueba({
    id: IDS_PRUEBA.propietarioOtra,
    nombre: 'Propietaria otra',
    correo: 'propietaria.otra@barberly.test',
  });
  await crearUsuarioDePrueba({
    id: IDS_PRUEBA.barbero,
    nombre: 'Barbero',
    correo: 'barbero@barberly.test',
  });
  await crearUsuarioDePrueba({
    id: IDS_PRUEBA.barberoOtra,
    nombre: 'Barbero otra',
    correo: 'barbero.otra@barberly.test',
  });
  await crearClienteDePrueba({
    id: IDS_PRUEBA.cliente,
    nombre: 'Cliente',
    correo: 'cliente@barberly.test',
  });

  await crearBarberiaDePrueba({
    id: IDS_PRUEBA.barberia,
    propietarioId: IDS_PRUEBA.propietario,
    nombre: 'Barberia Centro',
    servicios: [
      { ...SERVICIOS_BASE[0]!, id: IDS_PRUEBA.servicioCorte },
      { ...SERVICIOS_BASE[1]!, id: IDS_PRUEBA.servicioBarba },
    ],
  });
  await crearBarberoDePrueba({
    usuarioId: IDS_PRUEBA.barbero,
    barberiaId: IDS_PRUEBA.barberia,
    perfilId: IDS_PRUEBA.perfilBarbero,
    nombreVisible: 'Carlos',
    servicioIds: [IDS_PRUEBA.servicioCorte, IDS_PRUEBA.servicioBarba],
  });

  await crearBarberiaDePrueba({
    id: IDS_PRUEBA.otraBarberia,
    propietarioId: IDS_PRUEBA.propietarioOtra,
    nombre: 'Barberia Norte',
    servicios: [{ ...SERVICIOS_BASE[0]!, id: IDS_PRUEBA.servicioOtra }],
  });
  await crearBarberoDePrueba({
    usuarioId: IDS_PRUEBA.barberoOtra,
    barberiaId: IDS_PRUEBA.otraBarberia,
    perfilId: IDS_PRUEBA.perfilBarberoOtra,
    nombreVisible: 'Andres',
    servicioIds: [IDS_PRUEBA.servicioOtra],
  });

  // Ambas cumplen la regla de publicacion (D-07).
  await baseDatos.barberia.updateMany({ data: { publicada: true } });
}
