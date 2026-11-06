import { StyleSheet, Text, View } from 'react-native';

import { textos } from '@/textos';
import { espacios, tipografia, useTema } from '@/tema';

// Marcador para rutas que se construyen en fases siguientes.
export function PantallaPendiente() {
  const { colores } = useTema();

  return (
    <View style={[estilos.contenedor, { backgroundColor: colores.colorFondo }]}>
      <Text style={[tipografia.cuerpo, { color: colores.colorTextoSecundario }]}>
        {textos.proximamente}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: espacios.espacio4,
  },
});
