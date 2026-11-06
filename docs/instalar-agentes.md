# Agentes y skills de Barberly

## Que hay
```
CLAUDE.md          # Claude Code lee este archivo; importa AGENTS.md
.claude/
  agents/          # 1 orquestador + 6 especialistas
  hooks/           # guardias y formato automatico
  skills/          # 16 skills: 11 tecnicas, protocolo-subagente y 4 comandos
  settings.json    # permisos del proyecto
```

## Verificar
Abre Claude Code en la raiz del repo:
- `/agents` → 7 agentes sin errores.
- `/skills` → 16 skills del proyecto, ademas de las de plugins.
- `/hooks` → `proteger`, `limitar-rutas` y `formatear`.

Las 12 skills con `user-invocable: false` no salen en el menu `/`: las usan los agentes.

## Comandos
| Comando | Que hace |
| --- | --- |
| `/tarea <modulo> <codigos>` | Flujo completo con el orquestador, en la sesion principal |
| `/especificar <modulo> <secciones DERCAS>` | Solo `analista-spec`; muestra las Dudas al final |
| `/revisar` | Solo `revisor-seguridad` sobre los cambios actuales |
| `/verificar` | Corre lint, typecheck y test en los workspaces y resume en 5 lineas o menos |

Tambien puedes usar `claude --agent orquestador` y escribir la tarea.

## Flujo
Esta en [orquestador.md](../.claude/agents/orquestador.md).

## Agregar agentes
Crea `.claude/agents/<nombre>.md` con `protocolo-subagente` primero en `skills:` agregalo a la lista `Agent(...)` del orquestador y a `limitar-rutas.mjs`. Candidatos: `asesor-ia` (Fase 5), `pagos` (Fase 4), `estadisticas`.
