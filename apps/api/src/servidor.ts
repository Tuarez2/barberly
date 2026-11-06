import { app } from './app';
import { configuracion } from './compartido/configuracion';
import { registro } from './compartido/registro';
import { iniciarTareas } from './tareas';

app.listen(configuracion.PUERTO, () => {
  registro.info(`API en el puerto ${configuracion.PUERTO}`);
  iniciarTareas();
});
