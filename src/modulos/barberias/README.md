# Módulo barberias

Registro de la barbería por su propietario, listado público y, más adelante, su administración (§10.2). Especificaciones: `docs/especificaciones/autenticacion.md` (bloque POST /barberias) y `docs/especificaciones/busqueda.md` (GET /barberias).

## Endpoints

| Método | Ruta              | Rol | Éxito | Errores                                                             | Tarea |
| ------ | ----------------- | --- | ----- | ------------------------------------------------------------------- | ----- |
| GET    | /api/v1/barberias | Pub | 200   | DATOS_INVALIDOS 422, AUTENTICACION_REQUERIDA 401, TOKEN_VENCIDO 401 | T2.8  |
| POST   | /api/v1/barberias | Pub | 201   | DATOS_INVALIDOS 422, AUTENTICACION_REQUERIDA 401, TOKEN_VENCIDO 401 | T1.9  |

### GET /barberias (BUS-01 a BUS-04, HU-BUS-01, HU-BUS-03, D-07, D-31)

Exige `Authorization: Bearer <token de acceso>`; cualquier rol ve el mismo listado. Consulta (`esquemaConsultaBarberias` de `src/compartido/contrato.ts`, sin parámetros extra):

| Parámetro  | Regla                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `q`        | 1 a 80 caracteres tras recortar; el nombre lo contiene, sin tildes ni mayúsculas               |
| `servicio` | Igual que `q`, contra el nombre de un Servicio activo de la barbería (sin repetir la barbería) |
| `abierta`  | `true`: solo las abiertas ahora; `false` o ausente: todas                                      |
| `orden`    | Solo `nombre` (por defecto): ascendente y luego `id`                                           |
| `pagina`   | Entero desde 1; por defecto 1                                                                  |
| `limite`   | Entero de 1 a 50; por defecto 10                                                               |

Respuesta 200:

```json
{
  "datos": [
    {
      "id": "…",
      "nombre": "Clásica Norte",
      "direccion": "Av. 9 de Octubre 100",
      "urlPortada": null,
      "abierta": true
    }
  ],
  "meta": { "pagina": 1, "limite": 10, "total": 1 }
}
```

- Solo barberías `activo` y `publicada` (D-07). Es público: tampoco sus miembros ven aquí su barbería no publicada (D-32).
- Búsqueda con `unaccent` de PostgreSQL en los dos lados e `ILIKE`; `%`, `_` y `\` del texto se escapan y se buscan literales. La consulta es `$queryRaw` con `Prisma.sql` etiquetada: nunca se concatena el texto.
- `abierta` (D-31) se calcula en la `zonaHoraria` de cada barbería con el horario general (`perfilBarberoId` nulo) del día de hoy (0 = domingo): apertura inclusive, cierre y pausa exclusivos, y sin un Bloqueo de toda la barbería que cubra el instante. Los horarios y bloqueos de barberos no cuentan.
- `urlPortada` se genera al leer y es `null` sin portada; nunca se expone `archivoPortada`. Mientras no exista `AlmacenArchivos`, apunta a `/api/v1/almacen/<clave>`.
- Página sin resultados o sin coincidencias: `datos` vacío con el `total` real (no es error).

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

`barberias.prueba.ts`: criterios de HU-AUT-03, cada validación con sus límites, la sesión (sin token, vencido, usuario inactivo o inexistente) y el aislamiento con la otra barbería. `listado.prueba.ts`: criterios de HU-BUS-01 y HU-BUS-03, los filtros, `abierta` en sus límites y en hora local, la validación de la consulta, la sesión y el aislamiento (D-07, D-32). Bruno: `bruno/barberias/`.
