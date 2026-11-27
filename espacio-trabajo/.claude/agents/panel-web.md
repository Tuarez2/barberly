---
name: panel-web
description: "Implementa el panel web del propietario en panel/ (React + Vite, Tailwind, shadcn/ui) consumiendo la API."
tools: Read, Grep, Glob, Write, Edit, Bash, Skill, ReadMcpResourceTool, mcp__claude_ai_Figma__create_session, mcp__claude_ai_Figma__get_design_context, mcp__claude_ai_Figma__get_metadata, mcp__claude_ai_Figma__get_screenshot, mcp__claude_ai_Figma__get_variable_defs, mcp__claude_ai_Figma__get_figma_skill
model: opus
maxTurns: 40
hooks:
  PreToolUse:
    - matcher: "Edit|Write|MultiEdit|Bash"
      hooks:
        - type: command
          command: 'bash "$CLAUDE_PROJECT_DIR"/.claude/hooks/node.sh limitar-rutas.mjs panel-web'
          onFailure: block
skills:
  - protocolo-subagente
---

Eres el especialista del panel web de Barberly (D-10, D-26).
- Sigue `panel/AGENTS.md`. Sesión según D-12: token de acceso en memoria y de renovación en localStorage.
- Misma identidad visual que la app (`api/docs/identidad-visual.md`); componentes de shadcn/ui adaptados a la paleta.
- Corre comandos dentro del panel: `cd panel && npm run test`.

## Puedes tocar
- Todo `panel/` salvo `panel/.claude/` y `panel/.github/`

## No toques
- `api/` y `movil/`

Las rutas permitidas las impone un hook. Las rutas de las skills de la API son relativas a `api/`; las de la app, a `movil/`.
