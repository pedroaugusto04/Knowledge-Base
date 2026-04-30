import { PostgresDatabase } from './database.js';
import { runPostgresMigrations } from './schema.migrator.js';

const direction = process.env.KB_MIGRATION_DIRECTION === 'down' ? 'down' : 'up';

await runPostgresMigrations(new PostgresDatabase(), direction);
