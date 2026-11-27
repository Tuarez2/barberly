# Espacio de trabajo de agentes (D-27)

Copia versionada del espacio de trabajo `Barberly/`, la carpeta que contiene `api/`, `movil/` y `panel/`. Esa carpeta no es un repositorio, así que su configuración vive aquí.

```bash
cd api
bash espacio-trabajo/instalar.sh
cd .. && claude          # Claude Code en Barberly/
```

Contenido: `CLAUDE.md` (mapa de repositorios y reglas), el orquestador multi-repositorio, 11 especialistas (`analista-spec`, `base-datos`, `pruebas`, `api-backend`, `asesor-ia`, `pagos`, `app-movil`, `panel-web`, `disenador-ui`, `qa-e2e`, `revisor-seguridad`), los comandos `/funcionalidad`, `/tarea`, `/verificar`, `/revisar`, `/especificar` y `/decidir`, y los mismos hooks de los repositorios con las rutas vistas desde la raíz. Las skills técnicas se enlazan desde cada repositorio, así no se duplican.
