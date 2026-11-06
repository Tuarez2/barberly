---
name: almacen-archivos
description: "Reglas para subir, guardar, servir y eliminar imagenes con AlmacenArchivos (multer, sharp, S3). Usar al tocar foto de referencia, portada, foto del barbero o limpiarArchivos. No usar para la foto del rostro del asesor, que nunca pasa por aqui."
---

# Almacenamiento de archivos

Fuente: DERCAS §8.7.

## Interfaz
`AlmacenArchivos`: `guardar(clave, buffer, tipoMime)`, `urlPublica(clave)`, `urlTemporal(clave, segundos)`, `eliminar(clave)`, `listar(prefijo)`.
- `AlmacenLocal`: desarrollo, carpeta `apps/api/almacen/` (ignorada en git). Sirve con `GET /api/v1/almacen/*`, solo con `ALMACEN_TIPO=local`; `urlTemporal` lleva vencimiento y firma.
- `AlmacenMemoria`: pruebas. Nunca S3 ni disco en pruebas.
- `AlmacenS3`: produccion (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`); compatible con Cloudflare R2 o Supabase Storage.
- Se elige con `ALMACEN_TIPO`.

## Subida
- `multer` en memoria, maximo 5 MB.
- Solo JPEG o PNG verificados por contenido, no por extension.
- `sharp`: 1024 px en el lado mayor, JPEG calidad 80, sin metadatos (elimina el GPS).
- Errores: mayor de 5 MB o tipo no valido → `DATOS_INVALIDOS` (422). Cita no activa o ya iniciada → `TRANSICION_INVALIDA` (409). `IMAGEN_NO_VALIDA` es solo del asesor.

## Claves
`citas/<citaId>/referencia-<uuid>.jpg` · `barberias/<barberiaId>/portada-<uuid>.jpg` · `barberos/<perfilBarberoId>/foto-<uuid>.jpg`

## Campos y respuesta
- La BD guarda la clave: `archivoFotoReferencia`, `archivoPortada`, `archivoFoto`.
- La API responde `urlFotoReferencia`, `urlPortada`, `urlFoto`, generadas al leer.
- Foto de referencia privada: `urlTemporal` de 10 minutos. Portada y foto del barbero publicas: `urlPublica`.

## Reglas
- La foto del rostro del asesor NUNCA pasa por `AlmacenArchivos` (RN-27).
- RN-31: una foto por cita; la segunda reemplaza a la anterior y se elimina la vieja.
- Estado final (incluida la cancelacion por anticipo vencido): `archivoFotoReferencia` en nulo dentro de la misma transaccion; el archivo se elimina despues del commit.
- Si falla la eliminacion: registrar en el log, sin fallar la solicitud; `limpiarArchivos` lo reintenta recorriendo `citas/` con `listar`.
