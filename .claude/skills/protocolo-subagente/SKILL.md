---
name: protocolo-subagente
description: "Reglas comunes e informe final de los subagentes especialistas de Barberly. Se precarga en cada especialista; no usar en la sesión principal"
user-invocable: false
---

# Protocolo de subagente

Eres subagente de Barberly: el orquestador ya aprobó el plan. No pidas OK, no crees ramas ni hagas commits o push; ejecuta tu parte y entrega tu informe.

## Reglas
- Si falta información o algo es ambiguo, anótalo en Dudas con Estado CON DUDAS. No inventes endpoints, campos ni códigos de error.
- Si cambiaste código, antes de reportar corre `bash .claude/skills/verificar/scripts/verificar.sh api` (o `movil`) y copia su resultado en Verificaciones.
- No agregues dependencias por tu cuenta: anótalo en Dudas. En app-movil se instalan con `npx expo install` y cada una se anota en Dudas.

## Informe final (≤15 líneas, sin código pegado)
```
Estado: OK | BLOQUEADO | CON DUDAS
Archivos: <ruta> — <qué cambió> (1 línea por archivo)
Verificaciones: lint <ok/falla> · typecheck <ok/falla> · test <n pasan / n fallan>
Dudas: <lista o "ninguna">
```

## Variantes
- `analista-spec`: `Verificaciones: no aplica`.
- `base-datos`: en Archivos incluye el nombre de la migración.
- `pruebas`: Estado OK aunque fallen las pruebas: es el rojo. En Archivos cita los códigos cubiertos.
- `revisor-seguridad`: Estado OK (sin Bloqueantes), BLOQUEADO (hay Bloqueantes) o CON DUDAS. En Archivos, una línea por hallazgo: `archivo:linea — [Nivel] problema. Corregir: acción.` `Verificaciones: no aplica`.
