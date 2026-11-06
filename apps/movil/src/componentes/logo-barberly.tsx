import { Image, StyleSheet } from 'react-native';

import { textos } from '@/textos';
import { useTema } from '@/tema';

const LOGOS = {
  claro: require('@/assets/marca/logo-claro.png'),
  oscuro: require('@/assets/marca/logo-oscuro.png'),
};

export function LogoBarberly() {
  const { modo } = useTema();

  return (
    <Image
      accessibilityRole="image"
      accessibilityLabel={textos.marca}
      source={LOGOS[modo]}
      style={estilos.logo}
    />
  );
}

const estilos = StyleSheet.create({
  logo: { height: 43, width: 153 },
});
