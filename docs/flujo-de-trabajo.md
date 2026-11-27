# Flujo de trabajo

Cómo avanza Barberly: una rama por tarea y un PR por funcionalidad (AGENTS.md), en rebanadas verticales de API, app y panel (D-20, D-27). Claude crea las ramas, hace los commits, une cada tarea a su funcionalidad, publica la rama y abre el PR (D-29); el usuario aprueba el plan, prueba, revisa el PR y lo fusiona en GitHub. Lo siguen el usuario y los agentes. Tareas y funcionalidades están en `docs/hoja-de-ruta.md`; lo que pasa dentro de una tarea, en `.claude/agents/orquestador.md`.

## Roles

| Quién | Hace | No hace |
| --- | --- | --- |
| Usuario (líder y revisor) | Elige la funcionalidad, aprueba el plan, prueba en el teléfono, revisa el PR y lo fusiona en GitHub | Commits o ramas a mano (salvo que quiera) |
| Orquestador (`/funcionalidad`, `/tarea`) | Lee la tarea, propone el plan, delega, verifica, crea las ramas, hace el commit de cada tarea, la une a su funcionalidad, publica la rama y abre el PR | Empezar sin OK, commit o merge en `main`, push a `main` o con `--force`, fusionar el PR |
| Especialistas | Su parte, según `protocolo-subagente` | Delegar, crear ramas, commits, push |
| CI (GitHub Actions) | Formato, `lint`, `typecheck` y `test` en cada PR | — |

## Conceptos

- **Tarea** (`Tn.m`): unidad pequeña de trabajo, hasta ~5 archivos. Una rama propia.
- **Funcionalidad** (`Fn.X`): grupo de tareas que entrega algo completo, normalmente una HU de punta a punta (API + app). Un PR.

## Reglas fijas

- `main` siempre en verde. Solo entra código por PR con CI verde; nunca commits directos.
- Un solo PR abierto a la vez.
- Claude hace commit solo con `verificar.sh` en verde y `revisor-seguridad` sin Bloqueantes; nunca commit, merge ni push en `main`, ni push con `--force`, ni `gh pr merge` (lo bloquea el hook `proteger`, D-29).
- Si la tarea no está en la hoja de ruta, primero se agrega.

## Ramas

| Rama | Sale de | Se une a | Ejemplo |
| --- | --- | --- | --- |
| Funcionalidad | `main` | `main`, por PR | `funcionalidad/registro-sesion` |
| Tarea | La rama de su funcionalidad | Su funcionalidad, con merge local | `feat/autenticacion-registro` |

- Tarea: `<tipo>/<modulo>-<tema>`, en minúsculas con guiones, sin tildes. Tipos: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`.
- Si la funcionalidad tiene una sola tarea, la rama de la tarea es la del PR: sale de `main` y no hace falta la rama `funcionalidad/...`.
- La hoja de ruta trae el nombre de cada rama.

## Commits y título del PR

- Commit de tarea: `tipo(modulo): descripcion en infinitivo (CODIGOS)`. Ejemplo: `feat(autenticacion): registrar usuario (AUT-01, HU-AUT-01)`.
- Título del PR: `feat(modulo): funcionalidad (CODIGOS)`. Ejemplo: `feat(autenticacion): registro e inicio de sesión (HU-AUT-01, HU-AUT-02)`.
- El PR se fusiona con "Create a merge commit": en `main` quedan los commits de cada tarea.

## Ciclo de una funcionalidad (automático, D-29)

### 1. Pedirla (usuario)

En Claude Code abierto en `Barberly/`: `/funcionalidad E2.B` (o `/tarea T2.8` para una sola tarea). Si la especificación del módulo tiene Dudas que cambian reglas de negocio, antes `/decidir <modulo>`.

### 2. Aprobar el plan (usuario)

Claude muestra un plan de 5 a 8 líneas para toda la funcionalidad. Respondes OK o lo corriges. Nada se escribe antes del OK.

### 3. Ejecutar (Claude)

1. En cada repositorio que toca: `git switch main && git pull --ff-only` y crea la rama de la funcionalidad.
2. Por cada tarea, en el orden de la hoja de ruta:
   - Crea la rama de la tarea desde la funcionalidad.
   - Delega a los especialistas, corre `verificar.sh` tras cada uno y `revisor-seguridad` al final.
   - Con todo en verde: marca la tarea `hecha` en `docs/hoja-de-ruta.md`, hace el commit (`tipo(modulo): descripcion (CODIGOS, Tn.n)`), la une a la funcionalidad con `git merge --no-ff` y borra la rama de la tarea.
   - Si algo queda en rojo o hay una duda que cambia reglas de negocio, para y te pregunta.
3. Al terminar todas las tareas: `git push -u origin <funcionalidad>` y `gh pr create` con la plantilla llena (qué entrega, tareas, cómo probarlo, dudas menores decididas y resultado de la revisión).
4. Te entrega los enlaces de los PR.

### 4. Probar, revisar y fusionar (usuario)

1. Prueba la funcionalidad en el teléfono contra sus criterios de aceptación.
2. En GitHub: "Files changed" con ojos de revisor, CI verde y checklist completo → "Create a merge commit" → borrar la rama.
3. Si algo no convence, dilo en Claude Code: hace una rama `fix/...` desde la funcionalidad, la corrige con el mismo ciclo y vuelve a publicar.
4. Después de fusionar: `git switch main && git pull` (o pídeselo a Claude en la siguiente funcionalidad, que empieza haciéndolo).

### Configuración única

- `gh auth login` en el computador donde corre Claude Code, para que pueda abrir los PR.
- Claude Code pide permiso para `git commit` y `git push` según `.claude/settings.json`; puedes aprobarlos una vez por sesión con "Yes, and don't ask again" o cambiar ese archivo tú mismo.

## Cómo revisar

Por tarea (paso 7) y otra vez en el PR:

- ¿Hace solo lo de la tarea o la funcionalidad? Archivos fuera del alcance: se quitan o van a otra tarea.
- ¿Nombres propios en español (AGENTS.md)?
- ¿Hay una prueba por cada criterio de aceptación y, si aplica, la de "otra barbería → 404"?
- ¿`/revisar` sin Bloqueantes?
- ¿Endpoints, campos y errores existen en el DERCAS o en `docs/decisiones.md`?
- ¿Dependencias nuevas justificadas?
- ¿Entiendes cada archivo? Si no, no se une todavía.

## Cuando algo falla

| Situación | Qué hacer |
| --- | --- |
| CI en rojo en el PR | No se fusiona. Claude hace una rama `fix/...` desde la funcionalidad, con el mismo ciclo de tarea, y publica de nuevo |
| Especialista BLOQUEADO o CON DUDAS | `/decidir <modulo>` y se retoma la tarea |
| La tarea crece más de ~5 archivos | El orquestador la divide; se actualiza la hoja de ruta |
| Error encontrado en `main` | Funcionalidad de una sola tarea `fix/...` desde `main` |
| Cambia un requisito | Primero la especificación (`/especificar`) y luego el código |
| `main` avanzó durante la funcionalidad | Claude, en la rama de la funcionalidad: `git merge origin/main` y `git push` |

## Fin de fase

- Todas las funcionalidades de la fase fusionadas y la "Entrega" de `docs/hoja-de-ruta.md` comprobada en el teléfono.
- Etiqueta en `main` (usuario, desde GitHub o su terminal):
  ```bash
  git tag -a fase-1 -m "Fase 1: base y autenticación"
  ```
- Antes de empezar la siguiente fase: `/especificar` de sus módulos y `/decidir`, y se afinan sus tareas en la hoja de ruta.

## Configurar GitHub (una sola vez)

1. Settings → General → Pull Requests: deja solo "Allow merge commits" y activa "Automatically delete head branches".
2. Settings → Rules → Rulesets → New branch ruleset para `main`:
   - Require a pull request before merging (0 aprobaciones: GitHub no deja aprobar tu propio PR).
   - Require status checks to pass: `verificar` (aparece en la lista después de la primera ejecución del CI).
   - Block force pushes y Restrict deletions.
