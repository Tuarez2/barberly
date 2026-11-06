# Flujo de trabajo

Cómo avanza Barberly: una rama por tarea y un PR por funcionalidad (AGENTS.md). Cada tarea la revisa el usuario antes de unirla a su funcionalidad, y cada funcionalidad entra a `main` por PR. Lo siguen el usuario y los agentes. Tareas y funcionalidades están en `docs/hoja-de-ruta.md`; lo que pasa dentro de una tarea, en `.claude/agents/orquestador.md`.

## Roles

| Quién | Hace | No hace |
| --- | --- | --- |
| Usuario (líder y revisor) | Elige la tarea, crea las ramas, aprueba el plan, revisa, prueba en el teléfono, hace commit, merge local, PR y merge en GitHub | Push |
| Orquestador (`/tarea`) | Lee la tarea, propone el plan, delega, verifica, cierra con informe y mensaje de commit, y hace push cuando el usuario lo indica | Empezar sin OK, cambiar de tarea, commit, merge, push a `main` o con `--force` |
| Especialistas | Su parte, según `protocolo-subagente` | Delegar, crear ramas, commits, push |
| CI (GitHub Actions) | Formato, `lint`, `typecheck` y `test` en cada PR | — |

## Conceptos

- **Tarea** (`Tn.m`): unidad pequeña de trabajo, hasta ~5 archivos. Una rama propia.
- **Funcionalidad** (`Fn.X`): grupo de tareas que entrega algo completo, normalmente una HU de punta a punta (API + app). Un PR.

## Reglas fijas

- `main` siempre en verde. Solo entra código por PR con CI verde; nunca commits directos.
- Un solo PR abierto a la vez.
- Claude hace push solo de la rama actual y cuando el usuario lo indica; nunca a `main` ni con `--force`.
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

## Ciclo de una funcionalidad

### 1. Abrir la funcionalidad (usuario)

```bash
git switch main && git pull
git switch -c funcionalidad/registro-sesion
```

Claude publica la rama con `git push -u origin funcionalidad/registro-sesion`.

### 2. Cada tarea, en el orden de la hoja de ruta

1. **Crear la rama** (usuario):
   ```bash
   git switch funcionalidad/registro-sesion
   git switch -c feat/autenticacion-registro
   ```
2. **Resolver dudas** (usuario + Claude): si la especificación del módulo tiene Dudas que afectan a la tarea, `/decidir <modulo>`.
3. **Pedir** (usuario): `/tarea T1.5` en Claude Code, en la raíz del repo.
4. **Plan** (Claude): 5 a 8 líneas. El usuario responde OK o lo corrige. Nada se escribe antes del OK.
5. **Ejecutar** (Claude): orden del orquestador, `verificar.sh` tras cada especialista y `revisor-seguridad` al final.
6. **Cerrar** (Claude): informe de 10 líneas o menos y mensaje de commit.
7. **Revisar** (usuario):
   - Lee el diff (`git diff` o VS Code) y pide explicación de lo que no entiendas.
   - `/verificar` en verde.
   - Si toca la API: prueba con Bruno. Si toca la app: prueba en Expo Go.
   - Si algo no convence, díselo a Claude en la misma sesión y se vuelve al paso 5.
8. **Commit y unir a la funcionalidad** (usuario): marca la tarea como `hecha` en `docs/hoja-de-ruta.md` y luego:
   ```bash
   git add -A
   git commit -m "feat(autenticacion): registrar usuario (AUT-01, HU-AUT-01)"
   git switch funcionalidad/registro-sesion
   git merge --no-ff feat/autenticacion-registro
   git branch -d feat/autenticacion-registro
   ```
9. **Publicar** (Claude): cuando el usuario lo indica, `git push` de la funcionalidad.

### 3. Cerrar la funcionalidad (usuario)

Cuando todas sus tareas están `hecha`:

1. Prueba la funcionalidad completa en el teléfono contra sus criterios de aceptación.
2. Abre el PR: `gh pr create --base main --fill` (o desde GitHub; la plantilla se carga sola). Pide a Claude el cuerpo del PR con la plantilla y pega el resultado de `revisor-seguridad` de cada tarea (`/revisar` solo mira cambios sin commit, por eso se corre en cada tarea).
3. En GitHub: "Files changed" con ojos de revisor, CI verde y checklist completo → "Create a merge commit" → borrar la rama.
4. ```bash
   git switch main && git pull
   git branch -d funcionalidad/registro-sesion
   ```

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
| CI en rojo en el PR | No se fusiona. Rama `fix/...` desde la funcionalidad, con el mismo ciclo de tarea |
| Especialista BLOQUEADO o CON DUDAS | `/decidir <modulo>` y se retoma la tarea |
| La tarea crece más de ~5 archivos | El orquestador la divide; se actualiza la hoja de ruta |
| Error encontrado en `main` | Funcionalidad de una sola tarea `fix/...` desde `main` |
| Cambia un requisito | Primero la especificación (`/especificar`) y luego el código |
| `main` avanzó durante la funcionalidad | En la rama de la funcionalidad: `git merge main` (usuario) y `git push` (Claude) |

## Fin de fase

- Todas las funcionalidades de la fase fusionadas y la "Entrega" de `docs/hoja-de-ruta.md` comprobada en el teléfono.
- Etiqueta en `main` (usuario), y Claude la publica con `git push origin fase-1`:
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
