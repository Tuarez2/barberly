# Agentes y skills de Barberly — instalacion

## Que contiene
```
CLAUDE.md                      # Claude Code lee este archivo; importa AGENTS.md
.claude/
  agents/                      # 1 orquestador + 6 especialistas
  skills/                      # 8 skills propias, repartidas entre los agentes
  commands/tarea.md            # atajo /tarea
```

## Instalar
1. Copia el contenido del zip en la **raiz del repo** (`barberly/`), junto a `AGENTS.md`.
   - Si ya tienes un `CLAUDE.md`, no lo sobrescribas: agrega la linea `@AGENTS.md`.
2. Abre Claude Code en la raiz del repo y verifica:
   - `/agents` → deben aparecer los 7 agentes.
   - `/skills` → deben aparecer las 8 skills.
3. Si `/agents` marca error en la herramienta del orquestador, abre `.claude/agents/orquestador.md` y cambia `Agent(` por `Task(` en la linea `tools` (versiones antiguas de Claude Code).

## Usar
- Con atajo: `/tarea autenticacion AUT-01 RN-xx`
- Como agente principal de la sesion: `claude --agent orquestador`, y luego escribe la tarea.

El orquestador muestra un plan de 8 lineas, espera tu OK, delega en orden y cierra con un mensaje de commit sugerido. Tu haces el commit.

## Flujo
`analista-spec` → `base-datos` → `pruebas` (rojo) → `api-backend` (verde) → `revisor-seguridad` → `app-movil`

| Agente | Skills |
| --- | --- |
| orquestador | (ninguna; solo coordina) |
| analista-spec | especificar-sdd |
| base-datos | prisma-mysql |
| pruebas | pruebas-api |
| api-backend | arquitectura-api, multi-tenencia-seguridad, reservas-concurrencia |
| app-movil | expo-pantallas |
| revisor-seguridad | revision-codigo, multi-tenencia-seguridad |

## Requisitos previos
- `docs/DERCAS.md` exportado y `AGENTS.md` en la raiz.
- Idealmente `docs/reglas.md`, `docs/errores.md` y `docs/especificaciones/` (Prompt 1 de SDD). Si no existen, el orquestador pedira a `analista-spec` crearlos.

## Agregar agentes despues
Crea `.claude/agents/<nombre>.md` con `name`, `description`, `tools`, `skills`, y agregalo a la lista `Agent(...)` del orquestador. Candidatos para fases posteriores: `asesor-ia` (Fase 5), `pagos` (Fase 4), `estadisticas`.

## Consumo de tokens
Cada agente lee `AGENTS.md` + la especificacion de su modulo, no el DERCAS completo. Los informes son de ≤15 lineas. Si una tarea toca mas de ~5 archivos, dividela.
