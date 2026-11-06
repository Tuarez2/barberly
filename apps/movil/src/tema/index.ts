import { useColorScheme } from 'react-native';

import { colores, type ColoresTema } from './colores';
import { espacios } from './espacios';
import { radios } from './radios';
import { tipografia } from './tipografia';

export { colores, espacios, radios, tipografia };
export { fuentes } from './tipografia';

export interface Tema {
  modo: 'claro' | 'oscuro';
  colores: ColoresTema;
}

export function useTema(): Tema {
  const modo = useColorScheme() === 'dark' ? 'oscuro' : 'claro';
  return { modo, colores: colores[modo] };
}
