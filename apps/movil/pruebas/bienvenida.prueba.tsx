import { fireEvent, render, screen } from '@testing-library/react-native';

import Bienvenida from '../app/(autenticacion)/bienvenida';

const mockEmpujar = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockEmpujar }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('Fase 0: Bienvenida', () => {
  beforeEach(() => mockEmpujar.mockClear());

  it('muestra el lema y las dos acciones', async () => {
    await render(<Bienvenida />);

    expect(screen.getByText('Reserva tu corte')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeTruthy();
  });

  it('lleva a registro e inicio de sesion', async () => {
    await render(<Bienvenida />);

    await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(mockEmpujar.mock.calls).toEqual([['/registro'], ['/iniciar-sesion']]);
  });
});
