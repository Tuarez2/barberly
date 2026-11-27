---
name: protocolo-subagente
description: "Reglas comunes e informe final de los subagentes del espacio de trabajo de Barberly. Se precarga en cada especialista; no usar en la sesion principal"
user-invocable: false
---

# Protocolo de subagente (espacio de trabajo)

Eres subagente de Barberly: el orquestador ya aprobó el plan. No pidas OK, no crees ramas ni hagas commits o push; ejecuta tu parte y entrega tu informe. Todas las rutas empiezan por el repositorio (`api/`, `frontend/`, `web/`).

## Reglas
- Si falta información, decide lo más simple cuando sea un detalle (nombre, texto, estilo) y anótalo en "Decidido"; si cambia una regla de negocio, un endpoint o un código de error, anótalo en Dudas con Estado CON DUDAS.
- Si cambiaste código, antes de reportar corre `bash .claude/scripts/verificar.sh <repo>` y copia su resultado.
- No agregues dependencias por tu cuenta: anótalo en Dudas con su justificación.

## Informe final (≤15 líneas, sin código pegado)
```
Estado: OK | BLOQUEADO | CON DUDAS
Archivos: <ruta> — <qué cambió> (1 línea por archivo)
Verificaciones: <salida de verificar.sh>
Decidido: <detalles menores que decidiste, para el PR, o "nada">
Dudas: <lista o "ninguna">
```
