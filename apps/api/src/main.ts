import { buildApp } from './app';
import { config } from './config';
import { logger } from '@prosumate/logger';
import { seedDemoData } from '@prosumate/database';

async function bootstrap() {
  // Populate demo seed data for development
  seedDemoData();
  logger.info('Demo seed data successfully loaded into memory store');

  const app = buildApp();

  try {
    const address = await app.listen({ port: config.port, host: config.host });
    logger.info(`Prosumate API server listening on ${address}`, {
      port: config.port,
      env: config.env,
    });
  } catch (err: any) {
    logger.error('Failed to start API server', err);
    process.exit(1);
  }
}

bootstrap();
