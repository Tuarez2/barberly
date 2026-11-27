// Envio de correos detras de una interfaz propia (D-01, AGENTS.md). En E1.C no hay implementacion
// real: la de defecto solo escribe en el log. Las pruebas la reemplazan con fijarEnvioCorreo(),
// igual que el reloj (fijarAhora/restaurarAhora).
import { configuracion } from './configuracion';
import { registro } from './registro';

export interface EnvioCorreo {
  enviarCodigoRecuperacion(correo: string, codigo: string): Promise<void>;
}

// En desarrollo el codigo va al log para poder probar el flujo; en produccion nunca se registra
// ni el codigo ni el correo.
const envioPorRegistro: EnvioCorreo = {
  enviarCodigoRecuperacion(correo, codigo) {
    if (configuracion.NODE_ENV === 'production') {
      registro.warn('EnvioCorreo sin implementación real: no se envió el código de recuperación');
    } else {
      registro.info({ correo, codigoRecuperacion: codigo }, 'Código de recuperación (desarrollo)');
    }
    return Promise.resolve();
  },
};

let envioFijado: EnvioCorreo | null = null;

export function envioCorreo(): EnvioCorreo {
  return envioFijado ?? envioPorRegistro;
}

export function fijarEnvioCorreo(envio: EnvioCorreo): void {
  envioFijado = envio;
}

export function restaurarEnvioCorreo(): void {
  envioFijado = null;
}
