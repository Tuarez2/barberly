---
name: especificar-sdd
description: "Plantilla y proceso para convertir secciones del DERCAS en docs/especificaciones/<modulo>.md, docs/reglas.md y docs/errores.md. Usar al iniciar un modulo o cambiar un requisito. No usar para implementar."
---

# Especificar con SDD ligero

Objetivo: que los demas agentes lean 60–90 lineas en vez del DERCAS completo (~30k tokens).

## Proceso
1. Lee solo las secciones del DERCAS indicadas (RF, RN, CU, HU, §9 modelo, §10 API, Anexo B errores).
2. Copia literal nombres, rutas y codigos; no los reinventes ni los traduzcas.
3. Si algo es ambiguo o falta, va a la seccion "Dudas" al final del archivo; no lo resuelvas tu.
4. Si una regla RN afecta a varios modulos, ponla en `docs/reglas.md` (una linea por regla: codigo, enunciado, codigo de error) y referenciala por codigo.
5. Si aparece un codigo de error nuevo, agregalo a `docs/errores.md` (codigo, HTTP, cuando ocurre).

## Plantilla
Copia `docs/especificaciones/_plantilla.md` y respeta sus secciones y su orden. Agrega "Dudas" al final solo si hay alguna.
Ejemplo completo: `docs/especificaciones/autenticacion.md`.

## Calidad
- Cada criterio de aceptacion debe poder escribirse como una prueba: Dado/Cuando/Entonces con valores concretos.
- Seccion "Pantallas": pantalla, nodo de Figma y ruta, tomados de `docs/pantallas.md`.
- Maximo 90 lineas; si crece, dividir el modulo.
- Rutas bajo `/api/v1`, respuestas `{ datos, meta }` / `{ error: { codigo, mensaje, detalles } }`.
