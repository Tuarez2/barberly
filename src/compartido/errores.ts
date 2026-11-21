export class ErrorNegocio extends Error {
  constructor(
    public codigo: string,
    public http: number,
    mensaje: string,
    public detalles?: unknown,
  ) {
    super(mensaje);
    this.name = 'ErrorNegocio';
  }
}
