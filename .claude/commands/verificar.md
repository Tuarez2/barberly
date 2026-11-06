---
description: Corre lint, typecheck y test en los workspaces y resume el resultado
---

Corre con Bash, en la raiz del repositorio:

1. `npm run lint --workspaces --if-present`
2. `npm run typecheck --workspaces --if-present`
3. `npm run test --workspaces --if-present`

Resume en 5 lineas o menos: resultado por workspace y, si algo falla, el primer error. Si no existe `package.json` en la raiz, dilo y remite a `docs/especificaciones/preparacion.md`. No delegues ni corrijas nada.
