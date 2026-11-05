---
name: expo-pantallas
description: Convenciones para pantallas de la app Barberly con Expo Router, TanStack Query, React Hook Form + Zod, secure-store y textos en español. Usar al crear o modificar pantallas y llamadas a la API.
---

# Pantallas Expo

## Estructura (`apps/movil/`)
- Expo Router en `app/` con grupos por rol: `(autenticacion)`, `(cliente)`, `(barbero)`, `(propietario)`. Rutas y nombres de archivo en español, minusculas con guiones.
- `src/api/`: cliente HTTP unico (agrega `Authorization`, renueva el token una vez ante 401) y hooks por modulo (`useCitas`, `useCrearCita`).
- `src/componentes/`, `src/textos/` (todos los textos de interfaz y el mapa codigo de error → mensaje), `src/utilidades/` (fechas con Luxon).

## Reglas
- Datos del servidor con TanStack Query (`useQuery` / `useMutation`); invalida las claves afectadas tras cada mutacion.
- Formularios con React Hook Form + Zod; reutiliza los esquemas de `paquetes/compartido` cuando existan.
- Tokens solo en `expo-secure-store`; nunca en `AsyncStorage` ni en logs.
- Errores de la API: mapea `error.codigo` a un texto en español de `src/textos/`; nunca muestres el mensaje crudo ni el stack. Ejemplo: `HORARIO_OCUPADO` → "Ese horario ya fue tomado. Elige otro."
- Cada pantalla tiene estados de carga, vacio y error.
- Fechas: la API entrega ISO 8601 UTC; muestralas en `America/Guayaquil` con Luxon.
- Objetivos tactiles ≥ 44 pt; etiquetas de accesibilidad en botones e iconos.
- Instala dependencias con `npx expo install <paquete>` (versiones compatibles con el SDK). Avisa de cada una.
- La app nunca maneja datos de tarjeta; el pago va por la pasarela.
- La foto para el asesor se envia a la API y no se guarda en el dispositivo mas alla de la seleccion.

## Antes de terminar
`npm run typecheck && npm run lint`; indica al usuario que pantalla probar en Expo Go (Android).
