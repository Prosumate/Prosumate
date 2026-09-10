import { buildApp } from './app';
import { config } from './config';
import { logger } from '@prosumate/logger';
import { seedDemoData, createDatabaseClient, testDatabaseConnection } from '@prosumate/database';

async function bootstrap() {
  // 1. Attempt persistent PostgreSQL connection if DATABASE_URL is configured
  let persistenceMode = 'memory';

  if (config.databaseUrl) {
    try {
      const pgClient = createDatabaseClient(config.databaseUrl);
      if (pgClient) {
        const isConnected = await testDatabaseConnection(pgClient);
        if (isConnected) {
          persistenceMode = 'postgresql';
          logger.info('[DATABASE] Connected to PostgreSQL successfully', {
            pooler: config.databaseUrl.includes('pooler.supabase.com') ? 'supabase-transaction' : 'direct',
          });
        } else {
          logger.warn('[DATABASE] PostgreSQL connection test failed — falling back to in-memory store');
        }
      }
    } catch (err: any) {
      logger.warn(`[DATABASE] PostgreSQL connection error: ${err.message} — falling back to in-memory store`);
    }
  } else {
    logger.info('[DATABASE] No DATABASE_URL configured — using in-memory store (data will not persist across restarts)');
  }

  // 2. Seed demo data into in-memory database
  seedDemoData();
  logger.info(`Database initialized (mode: ${persistenceMode})`);

  // 3. Build and start Fastify app
  const app = buildApp();

  try {
    const address = await app.listen({ port: config.port, host: config.host });
    logger.info(`Prosumate API server listening on ${address}`, {
      port: config.port,
      env: config.env,
      persistenceMode,
      isTestEnvironment: config.isTestEnvironment,
    });
  } catch (err: any) {
    logger.error('Failed to start API server', err);
    process.exit(1);
  }
}

bootstrap();
