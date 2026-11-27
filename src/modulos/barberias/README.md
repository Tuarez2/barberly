# Módulo barberias

Registro de la barbería por su propietario y, más adelante, su administración (§10.2). Especificación de lo hecho hasta ahora: `docs/especificaciones/autenticacion.md` (bloque POST /barberias).

## Endpoints

| Método | Ruta              | Rol | Éxito | Errores                                                             | Tarea |
| ------ | ----------------- | --- | ----- | ------------------------------------------------------------------- | ----- |
| POST   | /api/v1/barberias | Pub | 201   | DATOS_INVALIDOS 422, AUTENTICACION_REQUERIDA 401, TOKEN_VENCIDO 401 | T1.9  |

### POST /barberias (AUT-10, HU-AUT-03, D-13)

Exige `Authorization: Bearer <token de acceso>`. Cuerpo, sin campos extra:

```json
{
  "nombre": "Corte Fino",
  "direccion": "Av. Amazonas 123",
  "telefono": "0991234567",
  "descripcion": "Cortes clásicos y modernos"
}
```

Respuesta 201:

```json
{
  "datos": {
    "id": "…",
    "nombre": "Corte Fino",
    "descripcion": "Cortes clásicos y modernos",
    "direccion": "Av. Amazonas 123",
    "telefono": "+593991234567",
    "publicada": false,
    "activo": true,
    "membresia": { "id": "…", "rol": "PROPIETARIO", "estado": "ACTIVO" }
  }
}
```

- Validación en `esquemaRegistroBarberia` de `src/compartido/contrato.ts`: el panel usa la misma. `nombre` de 3 a 80 y `direccion` de 3 a 200 (sin espacios al inicio ni al final); `telefono` con la validación y normalización de Usuario (D-14); `descripcion` opcional, hasta 500, y vacía se guarda `null`. Ninguno admite caracteres de control (tampoco saltos de línea).
- En una transacción crea la Barberia (`activo` verdadero, `publicada` falso: D-07) y la Membresia PROPIETARIO ACTIVO del usuario autenticado. Si algo falla, no queda ninguna de las dos.
- Reglas, zona horaria, anticipo y portada quedan con los valores por defecto del modelo; se editan con PATCH /barberias/:id (ADM). Campos como `publicada`, `zonaHoraria` o `propietarioId` en el cuerpo responden DATOS_INVALIDOS.
- Un usuario puede registrar varias barberías; no hay límite ni unicidad de nombre.
- Sin `contextoBarberia`: la barbería todavía no existe. La app o el panel vuelven a pedir GET /usuarios/yo para ver la membresía nueva.
- La barbería no aparece en el listado público hasta cumplir D-07 (servicios, horarios y barberos).

## Pruebas

`barberias.prueba.ts`: criterios de HU-AUT-03, cada validación con sus límites, la sesión (sin token, vencido, usuario inactivo o inexistente) y el aislamiento con la otra barbería. Bruno: `bruno/barberias/`.
