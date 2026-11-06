# Identidad visual de Barberly

Documento de referencia para diseño e interfaz. Los tokens van en camelCase, igual que las variables de Figma.

## 1. Concepto

**Barbería clásica, versión moderna.** Hueso, tinta y rojo barbero, con un detalle de latón. Se siente artesanal y confiable, pero con tipografía y espacios actuales para un público joven urbano.

**Elemento firma: "el corte".** Una diagonal fina de 9° que parte la palabra, como el corte de una navaja. Es lo único que se repite en toda la marca (ver sección 6). Todo lo demás se mantiene sobrio para que esta diagonal destaque.

## 2. Colores

Modo claro por defecto, modo oscuro derivado. Contrastes calculados con la fórmula WCAG.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `colorFondo` | `#F4EFE6` | `#161512` | Fondo de pantalla |
| `colorSuperficie` | `#FBF8F2` | `#211F1B` | Tarjetas, hojas, campos |
| `colorTinta` | `#1B1A17` | `#F4EFE6` | Texto principal |
| `colorTextoSecundario` | `#5C574E` | `#B5AE9F` | Texto de apoyo |
| `colorBorde` | `#DDD5C6` | `#34312B` | Bordes de 1 px |
| `colorPrimario` | `#9E2A2B` | `#B3262E` | Botón principal, el corte |
| `colorPrimarioPresionado` | `#7F1F20` | `#8F1F25` | Estado presionado |
| `colorSobrePrimario` | `#F4EFE6` | `#F4EFE6` | Texto sobre el botón primario |
| `colorTextoPrimario` | `#9E2A2B` | `#D9544F` | Enlaces y texto rojo sobre el fondo |
| `colorAcento` | `#B08D57` | `#C9A56B` | Detalles decorativos (latón) |
| `colorAcentoTexto` | `#7A5E2E` | `#C9A56B` | Texto o ícono en latón |
| `colorExito` | `#2F6B3F` | `#5DB27A` | Cita confirmada |
| `colorError` | `#B3261E` | `#F0716A` | Errores |
| `colorAviso` | `#7A5E2E` | `#C9A56B` | Avisos (reutiliza el latón de texto) |
| `colorVelo` | `#1B1A17` | `#000000` | Velo bajo la hoja inferior, al 50 % |
| `colorCalor1` | `#F2D7D4` | `#442321` | Mapa de calor: demanda más baja |
| `colorCalor2` | `#E8ADA7` | `#773733` | Mapa de calor |
| `colorCalor3` | `#D47C76` | `#AD4B47` | Mapa de calor |
| `colorCalor4` | `#B24743` | `#D66F69` | Mapa de calor |
| `colorCalor5` | `#7F2021` | `#F19E97` | Mapa de calor: demanda más alta |

**Contrastes clave (claro):** tinta sobre fondo 15.2, texto secundario 6.3, botón primario con su texto 6.5, éxito 5.6, error 5.7.
**Contrastes clave (oscuro):** texto sobre fondo 15.9, texto secundario 8.3, botón primario con su texto 5.7.

**Reglas de uso**
- `colorAcento` en claro (2.7) NO sirve para texto. Es solo decoración: filetes, íconos grandes, el detalle del ícono de la app. Para texto en latón se usa `colorAcentoTexto`.
- En oscuro, `colorTextoPrimario` sobre `colorSuperficie` da 4.2: solo para texto grande o íconos. Sobre `colorFondo` da 4.6 y sirve para texto normal. Por eso, sobre tarjetas y barras, el enlace va en tinta subrayada con el ícono en rojo, y en la pestaña activa solo el ícono es rojo.
- `colorCalor*` es una rampa de un solo tono, solo para el mapa de calor. En oscuro va al revés: a más demanda, más claro.
- Proporción orientativa: 70 % fondo y superficies, 20 % tinta, 8 % rojo, 2 % latón. El rojo aparece poco, por eso se nota.

## 3. Tipografía

| Rol | Fuente | Notas |
|---|---|---|
| Títulos y logo | **Fraunces** 600 / 700 | Serif con carácter. Gratis en Google Fonts |
| Cuerpo e interfaz | **DM Sans** 400 / 500 / 600 | Limpia y legible. Usar números tabulares en horas y precios |

| Estilo | Fuente | Tamaño / interlineado |
|---|---|---|
| `tituloGrande` | Fraunces 700 | 32 / 38 |
| `titulo` | Fraunces 700 | 24 / 30 |
| `subtitulo` | Fraunces 600 | 18 / 24 |
| `cuerpo` | DM Sans 400 | 16 / 24 |
| `cuerpoFuerte` | DM Sans 600 | 16 / 24 |
| `textoChico` | DM Sans 400 | 14 / 20 |
| `etiqueta` | DM Sans 600, mayúsculas, espaciado +0.08 em | 12 / 16 |
| `cifra` | DM Sans 600 | 24 / 30 |

Fraunces solo para títulos cortos y momentos de marca. Nunca en párrafos, botones ni cifras de datos.

## 4. Forma y espacio

- **Espaciado** (base 4): `espacio1` 4 · `espacio2` 8 · `espacio3` 12 · `espacio4` 16 · `espacio5` 24 · `espacio6` 32 · `espacio7` 48.
- **Radios:** `radioChico` 8 (campos, chips) · `radioBoton` 12 · `radioTarjeta` 16 · `radioTotal` 999 (avatares, etiquetas).
- **Sin sombras difusas.** La separación se logra con borde de 1 px (`colorBorde`) y con el cambio entre fondo y superficie, como en una pieza impresa. Solo la hoja inferior (bottom sheet) lleva una sombra suave: `sombraHoja`, negro al 12 %, desplazada −4 px en vertical, con 16 px de desenfoque.
- **Íconos:** set lineal (Lucide o Phosphor), trazo de 1.75 px, esquinas redondeadas. Sin emojis como íconos.
- **Fotos:** cortes y barberías reales, con luz natural. Nada de fotos de stock con modelos posando.

## 5. Logo

Archivos en `assets/marca/`:
- `logo-barberly-claro.svg` (tinta sobre fondo claro, corte rojo)
- `logo-barberly-oscuro.svg` (hueso sobre fondo oscuro, corte `#D9544F`)
- `icono-barberly.svg` (ícono de la app: "B" hueso sobre rojo, corte en latón)

Al crear `apps/movil` (Fase 0) se exportan desde aquí los PNG del ícono y del splash.

El texto está convertido a trazos, así que no depende de tener Fraunces instalada.

**Uso**
- Área libre alrededor: igual a la altura de la "B".
- Ancho mínimo del wordmark: 96 px. Por debajo de eso, usar el ícono.
- No cambiar el ángulo, el color ni el espacio del corte, y no agregar sombras ni degradados.
- El ícono es un borrador listo para probar. Para publicar en Play Store hay que adaptarlo al formato adaptativo de Android (primer plano y fondo por separado).

## 6. El corte en la app (máximo tres usos)

1. **Cabecera de Explorar:** filete diagonal rojo fino bajo el saludo.
2. **Confirmación de cita:** la pantalla de "Cita lista" lleva el corte cruzando el título.
3. **Carga:** una línea diagonal que atraviesa el espacio mientras se espera.

Si se repite en más lugares pierde el efecto.

## 7. Voz y textos

Tuteo, frases cortas, tono cercano y sin exceso de confianza.
- Acciones: "Reservar cita", "Elige tu barbero", "Confirmar cita". "Reserva tu corte" queda como lema de la Bienvenida.
- Estados vacíos: "Aún no tienes citas. Reserva la primera."
- Errores: "No pudimos guardar tu cita. Intenta de nuevo."
- Evitar: signos de exclamación seguidos, jerga forzada, mayúsculas sostenidas en títulos.
- Hasta definir el nombre del asesor con IA, llamarlo "Asesor de estilo".

## 8. Qué evitar (para que no se vea genérica)

- Degradados morados o azul-violeta, y tarjetas todas iguales con sombra.
- Tijera y peine cruzados como logo o como ícono.
- Más de un color de acento fuerte por pantalla.
- Pantallas llenas de cuadros: alternar tarjetas con zonas abiertas sobre el fondo.
- Texto en latón claro sobre fondo claro.

## 9. Diseño en Figma

Las pantallas viven en [Barberly App Móvil](https://www.figma.com/design/r8GKmXYO7AVhJBvdBqq992). Ahí están estos tokens como variables, con modos Claro y Oscuro, y los estilos de texto. Si cambia un valor, se cambia en este documento y en Figma.

- Filas del lienzo: Cliente y Acceso, Barbero, Propietario.
- Marco "Componentes": piezas reutilizables, con nombres en español.
- La estructura de las pantallas sale de `docs/DERCAS.md` §10.5. Si difiere de este documento, gana el DERCAS.

Se descartó Stitch: no ofrece Fraunces y reescribe los colores al generar.
