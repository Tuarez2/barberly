---
name: decidir
description: "Resuelve con el usuario las Dudas de un modulo, una por una, y las registra en docs/decisiones.md (ej. /decidir autenticacion)"
argument-hint: "<modulo>"
disable-model-invocation: true
---

Resuelve las Dudas del modulo `$ARGUMENTS` en esta sesion principal. No uses subagentes. Si falta el modulo, pidelo y no sigas.

## 1. Juntar
Reune todas las Dudas de ese modulo, con el archivo y la linea de cada una:
- `docs/especificaciones/<modulo>.md`
- `docs/reglas.md` y `docs/errores.md`: son globales; toma solo las que afecten al modulo por sus codigos RN, AUT o §.
- `docs/pantallas.md`
- Skills relacionadas: secciones "Dudas" en `.claude/skills/*/SKILL.md`.

Une las repetidas en una sola. Si no hay ninguna, dilo y termina. Si hay, di cuantas son y en que archivos antes de empezar.

## 2. Preguntar
Una duda por llamada a AskUserQuestion, nunca varias juntas:
- La pregunta se entiende sola: cita el codigo y el contexto, porque el usuario quiza solo vea el dialogo.
- 2 o 3 opciones concretas, sacadas del DERCAS y de las reglas vigentes. Un codigo o campo nuevo solo se propone como opcion, nunca se da por hecho.
- La recomendada va primero, con "(Recomendada)" al final de la etiqueta.
- La descripcion de cada opcion es una linea con el porque.

Lee solo la seccion puntual del DERCAS que necesites, con `bash .claude/skills/especificar-sdd/scripts/seccion-dercas.sh`.

## 3. Registrar
Con cada respuesta, antes de pasar a la siguiente duda:
1. Agrega una linea al final de `docs/decisiones.md`, con el numero siguiente al ultimo y la fecha de hoy (AAAA-MM-DD):
   `D-NN | fecha | modulo | duda | decision | afecta a (RN/AUT/§)`
   No uses `|` dentro de un campo.
2. En cada archivo donde estaba la duda, quitala y deja la regla con la referencia, por ejemplo "... (D-07)". La regla va en la seccion que le corresponda; renumera las Dudas restantes y borra el titulo si la seccion queda vacia.
3. Si la respuesta no decide nada (aplazar, falta informacion), deja la duda como esta y no gastes un numero.

Nunca edites `docs/DERCAS.md`: si la decision lo contradice, basta con la linea en `docs/decisiones.md`.

## 4. Cerrar
Al terminar, resume en 5 lineas o menos: decisiones tomadas (D-NN), dudas pendientes y archivos cambiados. No hagas commit.
