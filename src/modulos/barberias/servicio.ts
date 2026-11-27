// Logica de barberias (AUT-10, HU-AUT-03, D-07, D-13).
import { baseDatos } from '../../compartido/base-datos';
import type { BarberiaRegistrada, EntradaRegistroBarberia } from './esquemas';

// RNF-17: select explicito.
const seleccionBarberia = {
  id: true,
  nombre: true,
  descripcion: true,
  direccion: true,
  telefono: true,
  publicada: true,
  activo: true,
} as const;

// D-13: barberia y membresia PROPIETARIO ACTIVO en una sola transaccion. Nace sin publicar (D-07);
// reglas, zona horaria y anticipo quedan con los valores por defecto del modelo.
export async function registrar(
  usuarioId: string,
  entrada: EntradaRegistroBarberia,
): Promise<BarberiaRegistrada> {
  return baseDatos.$transaction(async (tx) => {
    const barberia = await tx.barberia.create({
      data: {
        nombre: entrada.nombre,
        descripcion: entrada.descripcion ?? null,
        direccion: entrada.direccion,
        telefono: entrada.telefono,
        publicada: false,
        activo: true,
      },
      select: seleccionBarberia,
    });
    const membresia = await tx.membresia.create({
      data: { usuarioId, barberiaId: barberia.id, rol: 'PROPIETARIO', estado: 'ACTIVO' },
      select: { id: true, rol: true, estado: true },
    });
    return { ...barberia, membresia };
  });
}
