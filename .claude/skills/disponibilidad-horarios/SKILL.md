---
name: disponibilidad-horarios
description: "Calculo de horarios y dias libres (GET /barberias/:id/disponibilidad y /disponibilidad/dias): algoritmo, zona horaria, Cualquiera disponible y rendimiento. Usar al implementar o modificar esos endpoints. No usar para crear citas (reservas-concurrencia)."
user-invocable: false
---

# Disponibilidad de horarios (RES-03, RES-04)

Fuente: DERCAS §8.6, §8.10, §4.1, §4.7, §9.2 y §10.2. Se calcula siempre en el backend. `ahora` viene de `reloj.ahora()`. Aislamiento: ver `multi-tenencia-seguridad`.

## Endpoints (rol Pub: exigen sesion)
- `GET /barberias/:id/disponibilidad`: `servicioId`, `barberoId` opcional (id de `PerfilBarbero`) y `fecha`.
- `GET /barberias/:id/disponibilidad/dias`: `servicioId`, `barberoId` opcional, `desde` y `hasta` en fechas locales `AAAA-MM-DD`, maximo 31 dias. Responde `{ datos: [{ fecha, disponible }] }`.

## Zona horaria
- Zona: `Barberia.zonaHoraria`, por defecto `America/Guayaquil` (UTC-05:00, sin horario de verano). Calcula con Luxon.
- `HorarioAtencion` guarda hora local por `diaSemana`; `Cita` y `Bloqueo` guardan UTC. Pasa todo a un mismo eje antes de comparar. La API devuelve ISO 8601 UTC.

## Algoritmo (un barbero, una fecha local)
1. Toma su horario laboral ese dia (`HorarioAtencion` con su `perfilBarberoId`) y recortalo al de la barberia (`perfilBarberoId` vacio) (RN-05).
2. Resta `inicioPausa`–`finPausa` y cada `Bloqueo` suyo o de toda la barberia (`perfilBarberoId` vacio) (RN-26).
3. Resta sus citas `PENDIENTE` y `CONFIRMADA`, con intervalo semiabierto `[iniciaEn, terminaEn)` (RN-04). Ignora las `PENDIENTE` con `anticipoVenceEn` vencido, sin esperar al proceso programado (§4.7).
4. Del tiempo libre, genera inicios cada 15 minutos donde quepa `Servicio.duracionMinutos` completa (RN-10).
5. Descarta los inicios anteriores a `ahora` + `minutosMinAnticipacion` (RN-06).
6. Fuera de `diasMaxAnticipacion` no hay inicios (RN-07, RES-03).

`/disponibilidad/dias` usa el mismo algoritmo: `disponible` es verdadero si la fecha conserva al menos un inicio (CU-07).

## Cualquiera disponible (sin `barberoId`)
- Candidatos: barberos que ofrecen el servicio (`ServicioBarbero`, RN-23).
- Calcula cada uno y une sus horarios libres, sin repetir inicios.
- Aqui no se asigna barbero: se asigna al confirmar (CU-07 A3, skill `reservas-concurrencia`).

## Una consulta por rango (RNF-01)
Menos de 1 s con 5 barberos y 1.000 citas.
- Lee las citas del rango en una sola consulta y los bloqueos en otra; procesa en memoria (§8.6). Con varios candidatos: `perfilBarberoId: { in: candidatos }`.
- Nunca una consulta por dia ni por barbero. Se apoya en el indice `(perfilBarberoId, iniciaEn, estado)`.

## Casos limite para las pruebas
- Cita que termina a las 10:00: el inicio de las 10:00 se ofrece.
- Hueco igual a la duracion del servicio: se ofrece. Hueco 15 minutos menor: no.
- Ultimo inicio que termina justo al cierre: se ofrece. Uno que lo pasa: no.
- Inicio exactamente en `ahora` + anticipacion minima: se ofrece. El anterior: no.
- `PENDIENTE` vencida: no ocupa. `PENDIENTE` vigente: ocupa.
- Bloqueo de toda la barberia: quita el horario a todos los barberos.
- Cita a las 20:00 locales (01:00 UTC del dia siguiente): cuenta en su fecha local.
- Cualquiera disponible: un inicio libre con un solo barbero se ofrece; ocupado en todos, no.
- `/disponibilidad/dias` con mas de 31 dias: entrada invalida (ver `pruebas-api`).

## Dudas (el DERCAS no lo define; no lo resuelvas por tu cuenta)
1. Forma de la respuesta de `GET /disponibilidad`, formato de `fecha` y si indica barbero con Cualquiera disponible.
2. Barbero sin `HorarioAtencion` propio ese dia: si hereda el general o no trabaja.
3. Base de los bloques de 15 minutos: desde la apertura o en horas de reloj (:00, :15).
4. Que dia es `diaSemana` 0. Luxon usa `weekday` de 1 (lunes) a 7 (domingo).
5. Como se mide `diasMaxAnticipacion`: desde `ahora` o por fecha local.
