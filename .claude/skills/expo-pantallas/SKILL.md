---
name: expo-pantallas
description: "Datos, navegacion, formularios, errores, modo sin conexion y pruebas de la app Expo. Usar al crear pantallas y llamadas a la API. No usar para colores, fuentes o componentes visuales (diseno-movil)."
user-invocable: false
---

# Pantallas Expo

## Estructura (`apps/movil/`)
- Expo Router en `app/` con grupos por rol: `(autenticacion)`, `(cliente)`, `(barbero)`, `(propietario)`. Rutas y nombres de archivo en español, minusculas con guiones.
- `src/api/`: cliente HTTP unico (agrega `Authorization`, renueva el token una vez ante 401) y hooks por modulo (`useCitas`, `useCrearCita`).
- `src/componentes/`, `src/textos/` (todos los textos de interfaz y el mapa codigo de error → mensaje), `src/utilidades/` (fechas con Luxon).

## Reglas
- La app solo habla con la API; nunca con MySQL, IA o pasarela.
- Datos del servidor con TanStack Query (`useQuery` / `useMutation`); invalida las claves afectadas tras cada mutacion.
- Formularios con React Hook Form + Zod; reutiliza los esquemas de `paquetes/compartido` cuando existan.
- Tokens solo en `expo-secure-store`; nunca en `AsyncStorage` ni en logs.
- Errores de la API: mapea `error.codigo` a un texto en español de `src/textos/`; nunca muestres el mensaje crudo ni el stack. Ejemplo: `HORARIO_OCUPADO` → "Ese horario ya fue tomado. Elige otro."
- Cada pantalla implementa los estados que tiene en `docs/pantallas.md` (vacio, error, carga, variantes).
- Fechas: la API entrega ISO 8601 UTC; muestralas en `America/Guayaquil` con Luxon.
- Objetivos tactiles ≥ 44 pt; etiquetas de accesibilidad en botones e iconos.
- Instala dependencias con `npx expo install <paquete>` (versiones compatibles con el SDK). Avisa de cada una.
- La app nunca maneja datos de tarjeta; el pago va por la pasarela.
- Foto para el asesor: RN-27; carga `multi-tenencia-seguridad` con `Skill` antes de tocarla.

## Navegacion
Por rol segun el grupo de rutas; la barberia activa (AUT-09) se guarda en `expo-secure-store`.

## Sin conexion
- `onlineManager` de TanStack Query con `@react-native-community/netinfo`.
- Cache persistida con `@tanstack/query-async-storage-persister` + AsyncStorage solo para lectura. Nunca persistir tokens ni fotos.
- Las escrituras se bloquean con aviso (DERCAS §10.5).

## Pruebas
- `jest-expo` + `@testing-library/react-native`, SOLO para los flujos de reserva y cancelacion (DERCAS §12.1, prioridad media). Vitest no se usa en la app.
- Archivos `*.prueba.tsx`, con `testMatch: ['**/*.prueba.tsx']`. Si reporta 0 pruebas, es un error de configuracion, no un exito.

## Antes de terminar
Verifica segun `protocolo-subagente`; indica al usuario que pantalla probar en Expo Go (Android).
