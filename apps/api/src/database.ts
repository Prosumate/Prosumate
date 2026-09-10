/**
 * Centralized Database Repository Accessor
 * 
 * All API controllers import `db()` from this module instead of directly
 * importing `memoryDb` from `@prosumate/database`. This establishes the
 * abstraction seam needed to swap between MemoryDatabase and a future
 * DrizzleRepository (persistent PostgreSQL) without touching controllers.
 * 
 * Current behavior:
 * - Returns the singleton MemoryDatabase instance
 * - When DATABASE_URL is configured and a DrizzleRepository is implemented,
 *   this accessor will be updated to return the persistent repository
 */

import { memoryDb, MemoryDatabase } from '@prosumate/database';

// The active repository instance. Currently always MemoryDatabase.
// Future: will be DrizzleRepository when DATABASE_URL is configured.
let activeRepository: MemoryDatabase = memoryDb;

/**
 * Returns the active database repository.
 * All controllers should use this instead of directly importing memoryDb.
 */
export function db(): MemoryDatabase {
  return activeRepository;
}

/**
 * Sets the active database repository.
 * Called during application bootstrap to configure the repository backend.
 */
export function setRepository(repo: MemoryDatabase): void {
  activeRepository = repo;
}
