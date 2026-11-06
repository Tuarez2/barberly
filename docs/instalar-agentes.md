# Agentes y skills de Barberly — instalacion

## Que contiene
```
CLAUDE.md                      # Claude Code lee este archivo; importa AGENTS.md
.claude/
  agents/                      # 1 orquestador + 6 especialistas
  skills/                      # 10 skills propias
  commands/                    # /tarea, /especificar, /revisar, /verificar
  settings.json                # permisos del proyecto
```

## Verificar
Abre Claude Code en la raiz del repo:
- `/agents` → deben aparecer los 7 agentes.
- `/skills` → deben aparecer las 10 skills.
- Si `/agents` marca error en la herramienta del orquestador, cambia `Agent(` por `Task(` en su linea `tools` (versiones antiguas de Claude Code).

## Usar
| Comando | Que hace |
| --- | --- |
| `/tarea <modulo> <codigos>` | Flujo completo con el orquestador |
| `/especificar <modulo> <secciones DERCAS>` | Solo `analista-spec`; muestra las Dudas al final |
| `/revisar` | Solo `revisor-seguridad` sobre los cambios actuales |
| `/verificar` | Corre lint, typecheck y test en los workspaces y resume en 5 lineas o menos |

Tambien puedes usar `claude --agent orquestador` y escribir la tarea. El orquestador no se invoca como subagente. Muestra un plan de 8 lineas, espera tu OK, delega en orden y cierra con un mensaje de commit sugerido. Tu haces el commit.

La Fase 0 no se orquesta: sigue `docs/especificaciones/preparacion.md` en la sesion principal.

## Flujos
- Completo: `analista-spec` → `base-datos` → `pruebas` (rojo) → `api-backend` (verde) → `app-movil` → `revisor-seguridad`
- Solo app: `analista-spec` (si hace falta) → `app-movil` → `revisor-seguridad`

Si un especialista responde BLOQUEADO o CON DUDAS, el orquestador para y te muestra las dudas. Excepcion: los Bloqueantes del revisor vuelven al especialista dueño del archivo, maximo 2 rondas, y luego para.

| Agente | Modelo | Skills precargadas | Skills bajo demanda |
| --- | --- | --- | --- |
| orquestador | inherit | ninguna | ninguna |
| analista-spec | sonnet | especificar-sdd | ninguna |
| base-datos | sonnet | prisma-mysql | ninguna |
| pruebas | sonnet | pruebas-api | ninguna |
| api-backend | sonnet | arquitectura-api, multi-tenencia-seguridad | reservas-concurrencia, almacen-archivos |
| app-movil | sonnet | expo-pantallas, diseno-movil | ninguna |
| revisor-seguridad | opus | revision-codigo, multi-tenencia-seguridad | reservas-concurrencia |

Las skills precargadas se cargan completas al iniciar el agente. Para las de bajo demanda, el agente necesita `Skill` en `tools`.

## Requisitos previos
- `docs/DERCAS.md` y `AGENTS.md`.
- `docs/reglas.md`, `docs/errores.md` y `docs/especificaciones/`. Si falta la especificacion de un modulo, el orquestador pide a `analista-spec` crearla.

## Agregar agentes despues
Crea `.claude/agents/<nombre>.md` con `name`, `description`, `tools`, `model` y `skills`, y agregalo a la lista `Agent(...)` del orquestador. Candidatos para fases posteriores: `asesor-ia` (Fase 5), `pagos` (Fase 4), `estadisticas`.

## Consumo de tokens
Cada agente lee `AGENTS.md` + la especificacion de su modulo, no el DERCAS completo. Los informes son de ≤15 lineas. Si una tarea toca mas de ~5 archivos, dividela.
