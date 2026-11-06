import type { TextStyle } from 'react-native';

// Claves con las que useFonts registra cada archivo (app/_layout.tsx).
export const fuentes = {
  fraunces600: 'Fraunces_600SemiBold',
  fraunces700: 'Fraunces_700Bold',
  dmSans400: 'DMSans_400Regular',
  dmSans500: 'DMSans_500Medium',
  dmSans600: 'DMSans_600SemiBold',
} as const;

// docs/identidad-visual.md §3. letterSpacing va en px: 0.08 em a 12 px ≈ 1.
export const tipografia = {
  tituloGrande: { fontFamily: fuentes.fraunces700, fontSize: 32, lineHeight: 38 },
  titulo: { fontFamily: fuentes.fraunces700, fontSize: 24, lineHeight: 30 },
  subtitulo: { fontFamily: fuentes.fraunces600, fontSize: 18, lineHeight: 24 },
  cuerpo: { fontFamily: fuentes.dmSans400, fontSize: 16, lineHeight: 24 },
  cuerpoFuerte: { fontFamily: fuentes.dmSans600, fontSize: 16, lineHeight: 24 },
  textoChico: { fontFamily: fuentes.dmSans400, fontSize: 14, lineHeight: 20 },
  etiqueta: {
    fontFamily: fuentes.dmSans600,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cifra: {
    fontFamily: fuentes.dmSans600,
    fontSize: 24,
    lineHeight: 30,
    fontVariant: ['tabular-nums'],
  },
} as const satisfies Record<string, TextStyle>;
