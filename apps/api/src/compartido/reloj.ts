// Los servicios usan ahora(); las pruebas fijan la hora con fijarAhora().
let fechaFijada: Date | null = null;

export function ahora(): Date {
  return fechaFijada ? new Date(fechaFijada) : new Date();
}

export function fijarAhora(fecha: Date): void {
  fechaFijada = new Date(fecha);
}

export function restaurarAhora(): void {
  fechaFijada = null;
}
