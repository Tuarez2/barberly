// Semillas de desarrollo (DERCAS §7.1, skill prisma-mysql): npm run seed -w apps/api
// Borra la base local y la vuelve a sembrar con las mismas fabricas que las pruebas.
// Todos los usuarios entran con la clave CLAVE_PRUEBA de src/pruebas/fabricas.ts (solo desarrollo).
import { baseDatos } from '../src/compartido/base-datos';
import { configuracion } from '../src/compartido/configuracion';
import { registro } from '../src/compartido/registro';
import {
  crearBarberoDePrueba,
  crearCitaDePrueba,
  crearClienteDePrueba,
  crearUsuarioDePrueba,
  escenarioBase,
  IDS_PRUEBA,
  idPrueba,
  limpiarBase,
} from '../src/pruebas/fabricas';

const BASE_PERMITIDA = '/barberly';
const DESFASE_GUAYAQUIL_HORAS = 5; // America/Guayaquil es UTC-05:00 todo el año (§8.10)

const IDS = {
  barberoDos: idPrueba(106),
  clienteDos: idPrueba(107),
  clienteTres: idPrueba(108),
  perfilBarberoDos: idPrueba(303),
} as const;

// Hora local de Guayaquil, dias desde hoy, convertida a UTC.
function horaLocal(diasDesdeHoy: number, hora: number, minuto = 0): Date {
  const ahoraLocal = new Date(Date.now() - DESFASE_GUAYAQUIL_HORAS * 3_600_000);
  return new Date(
    Date.UTC(
      ahoraLocal.getUTCFullYear(),
      ahoraLocal.getUTCMonth(),
      ahoraLocal.getUTCDate() + diasDesdeHoy,
      hora + DESFASE_GUAYAQUIL_HORAS,
      minuto,
    ),
  );
}

function verificarEntorno(): void {
  if (configuracion.NODE_ENV === 'production') {
    throw new Error('Las semillas no se ejecutan en produccion');
  }
  if (new URL(configuracion.DATABASE_URL).pathname !== BASE_PERMITIDA) {
    throw new Error('Las semillas solo se ejecutan sobre la base local barberly');
  }
}

async function sembrar(): Promise<void> {
  verificarEntorno();
  await limpiarBase();
  await escenarioBase();

  // Tercer barbero (§7.1): segundo de la Barberia Centro, solo hace cortes.
  await crearUsuarioDePrueba({
    id: IDS.barberoDos,
    nombre: 'Barbero dos',
    correo: 'barbero.dos@barberly.test',
  });
  await crearBarberoDePrueba({
    usuarioId: IDS.barberoDos,
    barberiaId: IDS_PRUEBA.barberia,
    perfilId: IDS.perfilBarberoDos,
    nombreVisible: 'Luis',
    servicioIds: [IDS_PRUEBA.servicioCorte],
  });
  await crearClienteDePrueba({
    id: IDS.clienteDos,
    nombre: 'Cliente dos',
    correo: 'cliente.dos@barberly.test',
  });
  await crearClienteDePrueba({
    id: IDS.clienteTres,
    nombre: 'Cliente tres',
    correo: 'cliente.tres@barberly.test',
  });

  const centro = { barberiaId: IDS_PRUEBA.barberia, servicioId: IDS_PRUEBA.servicioCorte };

  // Proximas: aparecen en la agenda y en Mis citas.
  await crearCitaDePrueba({
    ...centro,
    perfilBarberoId: IDS_PRUEBA.perfilBarbero,
    iniciaEn: horaLocal(1, 10),
  });
  await crearCitaDePrueba({
    ...centro,
    perfilBarberoId: IDS.perfilBarberoDos,
    clienteId: IDS.clienteDos,
    iniciaEn: horaLocal(1, 11),
  });
  await crearCitaDePrueba({
    barberiaId: IDS_PRUEBA.barberia,
    servicioId: IDS_PRUEBA.servicioBarba,
    perfilBarberoId: IDS_PRUEBA.perfilBarbero,
    clienteId: null,
    nombreCliente: 'Cliente sin cuenta',
    telefonoCliente: '0987654321',
    iniciaEn: horaLocal(2, 16),
  });
  await crearCitaDePrueba({
    barberiaId: IDS_PRUEBA.otraBarberia,
    servicioId: IDS_PRUEBA.servicioOtra,
    perfilBarberoId: IDS_PRUEBA.perfilBarberoOtra,
    clienteId: IDS.clienteTres,
    iniciaEn: horaLocal(1, 15),
  });

  // Historial: completada con su pago, cancelada y ausente.
  const completada = await crearCitaDePrueba({
    ...centro,
    perfilBarberoId: IDS_PRUEBA.perfilBarbero,
    iniciaEn: horaLocal(-1, 10),
    estado: 'COMPLETADA',
  });
  await baseDatos.pago.create({
    data: {
      id: idPrueba(901),
      citaId: completada.id,
      barberiaId: IDS_PRUEBA.barberia,
      tipo: 'FINAL',
      metodo: 'EFECTIVO',
      monto: completada.precioReserva,
      estado: 'APROBADO',
    },
  });
  const cancelada = await crearCitaDePrueba({
    ...centro,
    perfilBarberoId: IDS.perfilBarberoDos,
    clienteId: IDS.clienteDos,
    iniciaEn: horaLocal(-1, 12),
    estado: 'CANCELADA',
  });
  await baseDatos.cita.update({
    where: { id: cancelada.id },
    data: {
      canceladaPorId: IDS.clienteDos,
      canceladaEn: horaLocal(-2, 9),
      motivoCancelacion: 'No puedo asistir',
    },
  });
  await crearCitaDePrueba({
    ...centro,
    perfilBarberoId: IDS_PRUEBA.perfilBarbero,
    iniciaEn: horaLocal(-2, 17),
    estado: 'AUSENTE',
  });

  const [usuarios, barberias, citas] = await Promise.all([
    baseDatos.usuario.count(),
    baseDatos.barberia.count(),
    baseDatos.cita.count(),
  ]);
  registro.info({ usuarios, barberias, citas }, 'Semillas cargadas');
}

sembrar()
  .catch((error: unknown) => {
    registro.error({ err: error }, 'No se pudieron cargar las semillas');
    process.exitCode = 1;
  })
  .finally(() => baseDatos.$disconnect());
