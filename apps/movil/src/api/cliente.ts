import type { RespuestaError, RespuestaExito } from '@barberly/compartido';

const URL_API = process.env.EXPO_PUBLIC_URL_API;

export class ErrorApi extends Error {
  constructor(
    public codigo: string,
    public http: number,
    mensaje: string,
    public detalles?: unknown,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

// Cliente HTTP unico. Authorization y la renovacion del token llegan en la Fase 1.
export async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<RespuestaExito<T>> {
  if (!URL_API) throw new Error('Falta EXPO_PUBLIC_URL_API');

  const respuesta = await fetch(`${URL_API}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...opciones?.headers },
  });
  if (respuesta.status === 204) return { datos: undefined as T };

  const cuerpo: unknown = await respuesta.json();
  if (!respuesta.ok) {
    const { error } = cuerpo as RespuestaError;
    throw new ErrorApi(error.codigo, respuesta.status, error.mensaje, error.detalles);
  }
  return cuerpo as RespuestaExito<T>;
}
