import { useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/componentes/boton';
import { LogoBarberly } from '@/componentes/logo-barberly';
import { textos } from '@/textos';
import { espacios, tipografia, useTema } from '@/tema';

const ALTURA_FOTO = 380;

export default function Bienvenida() {
  const router = useRouter();
  const { colores } = useTema();
  const margenes = useSafeAreaInsets();

  return (
    <ScrollView
      bounces={false}
      contentContainerStyle={estilos.pantalla}
      style={{ backgroundColor: colores.colorFondo }}
    >
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no"
        resizeMode="cover"
        source={require('@/assets/imagenes/foto-portada.jpg')}
        style={estilos.foto}
      />
      <View style={estilos.contenido}>
        <LogoBarberly />
        <Text
          accessibilityRole="header"
          style={[tipografia.tituloGrande, { color: colores.colorTinta }]}
        >
          {textos.bienvenida.lema}
        </Text>
        <Text style={[tipografia.cuerpo, { color: colores.colorTextoSecundario }]}>
          {textos.bienvenida.descripcion}
        </Text>
      </View>
      <View style={[estilos.acciones, { paddingBottom: espacios.espacio5 + margenes.bottom }]}>
        <Boton
          etiqueta={textos.bienvenida.crearCuenta}
          alPresionar={() => router.push('/registro')}
        />
        <Boton
          etiqueta={textos.bienvenida.iniciarSesion}
          tipo="secundario"
          alPresionar={() => router.push('/iniciar-sesion')}
        />
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flexGrow: 1 },
  foto: { height: ALTURA_FOTO, width: '100%' },
  contenido: {
    flex: 1,
    gap: espacios.espacio3,
    paddingHorizontal: espacios.espacio4,
    paddingTop: espacios.espacio5,
  },
  acciones: {
    gap: espacios.espacio2,
    paddingHorizontal: espacios.espacio4,
    paddingTop: espacios.espacio5,
  },
});
