import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export async function backupDatabase(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

  await fs.mkdir(backupDir, { recursive: true });

  const command = `pg_dump ${process.env.DATABASE_URL} > ${backupFile}`;
  await execAsync(command);
}
