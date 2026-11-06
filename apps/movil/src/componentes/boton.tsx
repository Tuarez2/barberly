import { Pressable, StyleSheet, Text } from 'react-native';

import { radios, tipografia, useTema } from '@/tema';

interface PropiedadesBoton {
  etiqueta: string;
  tipo?: 'primario' | 'secundario';
  alPresionar: () => void;
}

const ALTURA_BOTON = 48;

export function Boton({ etiqueta, tipo = 'primario', alPresionar }: PropiedadesBoton) {
  const { colores } = useTema();
  const esPrimario = tipo === 'primario';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={alPresionar}
      style={({ pressed }) => [
        estilos.boton,
        esPrimario
          ? {
              backgroundColor: pressed ? colores.colorPrimarioPresionado : colores.colorPrimario,
            }
          : {
              borderColor: colores.colorTinta,
              borderWidth: StyleSheet.hairlineWidth * 2,
              opacity: pressed ? 0.7 : 1,
            },
      ]}
    >
      <Text
        style={[
          tipografia.cuerpoFuerte,
          { color: esPrimario ? colores.colorSobrePrimario : colores.colorTinta },
        ]}
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: radios.radioBoton,
    height: ALTURA_BOTON,
    justifyContent: 'center',
  },
});
