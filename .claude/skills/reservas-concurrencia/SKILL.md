---
name: reservas-concurrencia
description: "Patron obligatorio para crear citas sin doble reserva (transaccion, FOR UPDATE, indice unico). Usar al implementar o modificar la creacion de citas. No usar para cancelar ni cambiar estados de una cita."
user-invocable: false
---

# Reservas sin doble reserva (RN-04)

Orden de validacion y codigos de error exactos: DERCAS §8.5. No simplifiques este patron. `ahora` viene de `reloj.ahora()`.

## Patron
```ts
await prisma.$transaction(async (tx) => {
  // 1. Bloquear al barbero: PRIMERA instruccion; toda lectura de validacion va despues
  await tx.$queryRaw`SELECT id FROM perfiles_barbero WHERE id = ${barberoId} FOR UPDATE`;

  // 2. Cancelar sus PENDIENTE vencidas: inicioActivo sigue ocupado hasta cambiar el estado
  const vencidas = { perfilBarberoId: barberoId, estado: 'PENDIENTE', anticipoVenceEn: { lt: ahora } };
  const citasVencidas = await tx.cita.findMany({ where: vencidas, select: { id: true, archivoFotoReferencia: true } });
  await tx.cita.updateMany({
    where: vencidas,
    data: { estado: 'CANCELADA', canceladaEn: ahora, motivoCancelacion: 'Anticipo vencido', archivoFotoReferencia: null },
  }); // canceladaPorId nulo = Sistema
  // auditar cada id como "anticipo vencido" (updateMany solo devuelve el conteo)
  // tras el commit, eliminar sus fotos (skill almacen-archivos)

  // 3. Bloquear al cliente (siempre despues del barbero)
  await tx.$queryRaw`SELECT id FROM usuarios WHERE id = ${clienteId} FOR UPDATE`;

  // 4. Revalidar con lecturas actuales (dentro de la transaccion)
  //    cruce del barbero, cruce del cliente, limite de 3 futuras, horarios, anticipacion
  //    cruce y limite del cliente ignoran sus PENDIENTE vencidas con otros barberos
  const cruce = await tx.cita.findFirst({
    where: {
      perfilBarberoId: barberoId,
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
      iniciaEn: { lt: terminaEn },   // intervalo [iniciaEn, terminaEn)
      terminaEn: { gt: iniciaEn },
      // ignorar PENDIENTE vencida
      NOT: { estado: 'PENDIENTE', anticipoVenceEn: { lt: ahora } },
    },
  });
  if (cruce) throw new ErrorNegocio('HORARIO_OCUPADO', 409, '...');

  // 5. Insertar copiando terminaEn, precioReserva, duracionReserva (RN-02/03)
  return tx.cita.create({ data: { /* ... */ } });
}, {
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  maxWait: 10000,
  timeout: 10000,
});
```

## Reintentos
Si falla con `P2028` (tiempo de transaccion) o `P2034` (conflicto o interbloqueo), reintentar la transaccion completa hasta 2 veces: al reintentar vera la cita ya creada y respondera `HORARIO_OCUPADO` de forma normal.

## Cualquiera disponible (CU-07 A3)
Calcular los candidatos antes de abrir la transaccion. Dentro: bloquear a todos ordenados por `id` ascendente, cancelar sus vencidas (`perfilBarberoId: { in: candidatos }`), bloquear al cliente y elegir al de menos citas ese dia (empate: menor `id`).

Cita manual (`POST /barberias/:id/citas`): mismo patron y orden de validacion; sin `clienteId` se omiten el bloqueo del cliente y RN-08/RN-09; un barbero solo la crea en su propia agenda (`perfilBarberoId` = su perfil).

## Respaldo en base de datos
- Unico `(perfilBarberoId, inicioActivo)`: si falla con `P2002`, traducir a `HORARIO_OCUPADO` (409).
- Unico `(clienteId, claveIdempotencia)`: un reintento con la misma clave devuelve la cita ya creada, no una nueva.
- Una cita `PENDIENTE` vencida (`anticipoVenceEn` < ahora) no bloquea el horario.

## Reglas que se revalidan dentro de la transaccion
RN-05/06/07 (horario, anticipacion minima y maxima), RN-08/09 (cruce y limite del cliente), RN-10 (bloques de 15 min), RN-12/34 (estado inicial segun anticipo).

Pruebas: ver pruebas-api, sección Concurrencia.
