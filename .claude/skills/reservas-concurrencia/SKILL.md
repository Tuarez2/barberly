---
name: reservas-concurrencia
description: Patron obligatorio para crear citas sin doble reserva en Barberly (transaccion, SELECT FOR UPDATE, revalidacion, respaldo con indice unico). Usar al implementar o modificar la creacion de citas.
---

# Reservas sin doble reserva (RN-04)

Orden de validacion y codigos de error exactos: DERCAS §8.5. No simplifiques este patron.

## Patron
```ts
await prisma.$transaction(async (tx) => {
  // 1. Bloqueo, siempre en este orden: barbero, luego cliente
  await tx.$queryRaw`SELECT id FROM perfiles_barbero WHERE id = ${barberoId} FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM usuarios WHERE id = ${clienteId} FOR UPDATE`;

  // 2. Revalidar con lecturas actuales (dentro de la transaccion)
  //    cruce del barbero, cruce del cliente, limite de 3 futuras, horarios, anticipacion
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

  // 3. Insertar copiando terminaEn, precioReserva, duracionReserva (RN-02/03)
  return tx.cita.create({ data: { /* ... */ } });
});
```

## Respaldo en base de datos
- Unico `(perfilBarberoId, inicioActivo)`: si falla con `P2002`, traducir a `HORARIO_OCUPADO` (409).
- Unico `(clienteId, claveIdempotencia)`: un reintento con la misma clave devuelve la cita ya creada, no una nueva.
- Una cita `PENDIENTE` vencida (`anticipoVenceEn` < ahora) no bloquea el horario.

## Reglas que se revalidan dentro de la transaccion
RN-05/06/07 (horario, anticipacion minima y maxima), RN-08/09 (cruce y limite del cliente), RN-10 (bloques de 15 min), RN-12/34 (estado inicial segun anticipo).

## Prueba obligatoria
20 solicitudes simultaneas al mismo horario → exactamente 1 cita creada, 19 con `HORARIO_OCUPADO`. Terminar a las 10:00 y empezar a las 10:00 no se solapa.
