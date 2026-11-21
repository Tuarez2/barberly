// globalSetup de Vitest: las migraciones solo se aplican sobre barberly_prueba.
import { execFileSync } from 'node:child_process';

export default function migrarBase(): void {
  const url = new URL(process.env.DATABASE_URL ?? 'mysql://sin-configurar');
  if (url.pathname !== '/barberly_prueba') {
    throw new Error('Las pruebas solo corren sobre la base barberly_prueba');
  }
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], { stdio: 'pipe' });
}
