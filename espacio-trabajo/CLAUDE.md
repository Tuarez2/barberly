# Barberly — espacio de trabajo (D-27)

Barberly: citas para barberías con asesor de estilo por IA. Esta carpeta no es un repositorio: contiene los tres (D-11).

| Carpeta  | Repositorio      | Qué es                                                                      | Reglas            |
| -------- | ---------------- | --------------------------------------------------------------------------- | ----------------- |
| `api/`   | `barberly-api`   | API Express + Prisma + PostgreSQL y **toda la documentación** (`api/docs/`) | `api/AGENTS.md`   |
| `movil/` | `barberly-movil` | App Expo para clientes y barberos                                           | `movil/AGENTS.md` |
| `panel/` | `barberly-panel` | Panel web del propietario (React + Vite)                                    | `panel/AGENTS.md` |

Fuente de verdad: `api/docs/DERCAS.md` (solo la sección puntual, con `.claude/scripts/seccion-dercas.sh`) + `api/docs/decisiones.md`; si se contradicen, gana la decisión más reciente. El AGENTS.md de cada repositorio manda dentro de él.

## Cómo se trabaja

- Por rebanadas verticales (D-20): una funcionalidad de `api/docs/hoja-de-ruta.md` entrega API, app y panel juntos.
- `/funcionalidad <ID>` (ej. `/funcionalidad E2.C`): el orquestador planifica toda la funcionalidad, pide un solo OK y delega tarea por tarea en el repositorio de cada una.
- `/tarea <ID>`: una sola tarea. `/verificar [repo]` · `/revisar` · `/especificar <modulo> <secciones>` · `/decidir <modulo>`.
- Dudas menores: se decide lo más simple y se anota en el PR; solo las que cambian reglas de negocio van a `/decidir`.
- Cada repositorio tiene su git: usa `git -C api …`, `git -C movil …` o `git -C panel …`.

## Git

- Una rama por tarea y un PR por funcionalidad, en cada repositorio que toque la funcionalidad (`api/docs/flujo-de-trabajo.md`).
- El usuario aprueba el plan, revisa y fusiona en GitHub. Nunca push a `main` ni con `--force`.
- Los especialistas no crean ramas ni hacen commit o push.

## Contrato

`api/src/compartido/contrato.ts` es el original; `movil/src/api/contrato.ts` y `panel/src/api/contrato.ts` son copias. Si cambia, se copia en la misma funcionalidad.

## No negociable

Lo de los AGENTS.md de cada repositorio, y además: nunca leer ni tocar `.env`; nunca guardar la foto del rostro ni la imagen de "Pruébatelo" (RN-27); pasarelas solo en modo de prueba (D-24).
