import { buildApp } from './app';
import { config } from './config';
import { logger } from '@prosumate/logger';
import { seedDemoData } from '@prosumate/database';

async function bootstrap() {
  // Initialize pristine fresh database (0 demo contacts, 0 dummy funnels/conversations)
  seedDemoData();
  logger.info('Pristine database initialized with 0 demo records for Prosumateai@gmail.com');

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
