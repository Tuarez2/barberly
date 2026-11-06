---
name: diseno-movil
description: "Aspecto visual de la app: tokens, tema, fuentes, iconos, componentes y nodos de Figma. Usar al construir la interfaz de una pantalla. No usar para datos, rutas o estado (expo-pantallas)."
user-invocable: false
---

# Diseño movil

## Fuente de verdad
- `docs/identidad-visual.md`: tokens, tipografia y marca.
- `docs/pantallas.md`: pantalla → nodo de Figma, ruta y endpoints.

## Antes de construir una pantalla
1. Busca su nodo en `docs/pantallas.md` (fileKey en ese archivo).
2. Abre la sesión con `create_session` y el fileKey de `docs/pantallas.md`. Luego carga la skill `/figma-design-to-code` con `Skill` (plugin de Figma); si no está instalada, lee el recurso MCP `skill://figma/figma-design-to-code/SKILL.md` con `ReadMcpResourceTool` (servidor `claude.ai Figma`). En segundo plano esa herramienta no existe: lee la misma URI con `get_figma_skill`.
3. Consulta el nodo con `get_design_context` y `get_screenshot`; usa `get_metadata` para ver la estructura de un marco y `get_variable_defs` si dudas de un token.
4. El codigo de referencia de Figma se adapta a los componentes y tokens del proyecto; nunca se copia tal cual.

## Tema (`apps/movil/src/tema/`)
- `colores.ts` (modos claro y oscuro), `tipografia.ts`, `espacios.ts`, `radios.ts`.
- Hook `useTema()` con `useColorScheme`.
- Sin colores ni tamaños escritos directamente en las pantallas.

## Fuentes
- `@expo-google-fonts/fraunces` y `@expo-google-fonts/dm-sans`.
- Cargadas con `useFonts` en el layout raiz, manteniendo el splash hasta que carguen.

## Particularidades de React Native
- `letterSpacing` se mide en px: 0.08 em a 12 px ≈ 1.
- Horas y precios: `fontVariant: ['tabular-nums']`.

## Iconos
`lucide-react-native` (requiere `react-native-svg`), `strokeWidth` 1.75. Sin emojis como iconos.

## Librerias
- Sin librerias de componentes de interfaz (NativeBase, Tamagui, NativeWind): `StyleSheet` + tema.
- Graficos con `react-native-gifted-charts`.

## Componentes
En `src/componentes/`, con los mismos nombres que el marco "Componentes" de Figma (`Boton`, `CampoTexto`, `Chip`, `FilaBarberia`, `FilaCita`, etc.). La lista esta en `docs/pantallas.md`.

## Marca
"El corte" va en maximo 3 lugares (`docs/identidad-visual.md` §6).
