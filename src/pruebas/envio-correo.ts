// Doble de EnvioCorreo (D-01, AGENTS.md: servicios externos detras de interfaces propias).
// Captura los codigos de recuperacion en memoria para que las pruebas puedan usarlos; nunca envia.
// Se instala con el mismo patron del reloj (fijarAhora/restaurarAhora).
import {
  type EnvioCorreo,
  fijarEnvioCorreo,
  restaurarEnvioCorreo,
} from '../compartido/envio-correo';

export interface CorreoRecuperacionEnviado {
  correo: string;
  codigo: string;
}

// Como falla el proveedor simulado: rechaza la promesa o lanza antes de devolverla.
export type FalloEnvioCorreo = 'rechazo' | 'excepcion';

class EnvioCorreoDePrueba implements EnvioCorreo {
  readonly enviados: CorreoRecuperacionEnviado[] = [];
  private fallo: FalloEnvioCorreo | null = null;

  enviarCodigoRecuperacion(correo: string, codigo: string): Promise<void> {
    this.enviados.push({ correo, codigo });
    if (this.fallo === 'excepcion') throw new Error('Proveedor de correo simulado caido');
    if (this.fallo === 'rechazo') {
      return Promise.reject(new Error('Proveedor de correo simulado caido'));
    }
    return Promise.resolve();
  }

  // Los envios siguientes fallan; los codigos se siguen capturando.
  fallar(fallo: FalloEnvioCorreo | null): void {
    this.fallo = fallo;
  }

  enviadosA(correo: string): CorreoRecuperacionEnviado[] {
    return this.enviados.filter((enviado) => enviado.correo === correo);
  }

  // El ultimo codigo enviado a ese correo; falla si no se envio ninguno.
  ultimoCodigo(correo: string): string {
    const enviado = this.enviadosA(correo).at(-1);
    if (!enviado) throw new Error(`No se envio ningun codigo a ${correo}`);
    return enviado.codigo;
  }

  reiniciar(): void {
    this.enviados.length = 0;
    this.fallo = null;
  }
}

export const envioCorreoDePrueba = new EnvioCorreoDePrueba();

export function instalarEnvioCorreoDePrueba(): void {
  envioCorreoDePrueba.reiniciar();
  fijarEnvioCorreo(envioCorreoDePrueba);
}

// Vuelve a la implementacion por defecto (solo log) dentro de una prueba.
export function usarEnvioCorreoPorDefecto(): void {
  restaurarEnvioCorreo();
}

export function desinstalarEnvioCorreoDePrueba(): void {
  envioCorreoDePrueba.reiniciar();
  restaurarEnvioCorreo();
}
