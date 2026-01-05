// Sync Service - Handles online-offline synchronization

import { supabase } from './supabase-client';
import { sqliteService } from './sqlite-service';
import * as Types from './types';

class SyncService {
  private isSyncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Remove fields that no longer exist in the remote schema.
   * Right now this is only needed for the `users` table.
   */
  private sanitizeData(tableName: string, data: any): any {
    if (!data) return data;

    // Clone so we don't mutate original
    const cleaned = { ...data };

    if (tableName === 'users') {
      delete (cleaned as any).bio;
      delete (cleaned as any).display_name;
      delete (cleaned as any).displayName; // just in case
    }

    return cleaned;
  }

  /**
   * Queue a sync operation for later
   */
  queueSync(
    userId: string,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: any
  ): void {
    const id = sqliteService.generateId();
    const now = new Date().toISOString();

    // Sanitize before storing, so old bad fields don’t get retried forever
    const safeData = this.sanitizeData(tableName, data);

    sqliteService.run(
      `INSERT INTO sync_queue (
         id,
         user_id,
         table_name,
         record_id,
         operation,
         data,
         synced,
         retry_count,
         created_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        tableName,
        recordId,
        operation,
        JSON.stringify(safeData),
        0, // not synced
        0, // no retries yet
        now,
      ]
    );

    console.log(`📝 Queued ${operation} for ${tableName}:${recordId}`);
  }

  /**
   * Sync all pending items for a user
   */
  async syncAll(userId: string): Promise<void> {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress...');
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Starting sync...');

    try {
      const pendingItems = sqliteService.query<Types.SyncQueueItem>(
        `SELECT *
           FROM sync_queue
          WHERE user_id = ?
            AND synced = 0
          ORDER BY created_at ASC`,
        [userId]
      );

      console.log(`📊 Found ${pendingItems.length} items to sync`);

      for (const item of pendingItems) {
        await this.syncItemWithStatus(item);
      }

      console.log('✅ Sync complete');
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Wrapper that syncs a single item and updates its status in sync_queue
   */
  private async syncItemWithStatus(item: Types.SyncQueueItem): Promise<void> {
    try {
      const shouldMarkSynced = await this.syncItem(item);

      if (shouldMarkSynced) {
        sqliteService.run(
          `UPDATE sync_queue
              SET synced   = 1,
                  synced_at = ?
            WHERE id = ?`,
          [new Date().toISOString(), item.id]
        );
      }
    } catch (error) {
      console.error(`❌ Failed to sync item ${item.id}:`, error);

      sqliteService.run(
        `UPDATE sync_queue
            SET retry_count = retry_count + 1,
                last_error  = ?
          WHERE id = ?`,
        [error instanceof Error ? error.message : 'Unknown error', item.id]
      );
    }
  }

  /**
   * Sync a single item.
   * Returns true if the queue row should be marked as synced.
   */
  private async syncItem(item: Types.SyncQueueItem): Promise<boolean> {
    const rawData = item.data ? JSON.parse(item.data as any) : null;
    const data = this.sanitizeData(item.table_name, rawData);

    switch (item.operation) {
      case 'INSERT':
        return await this.syncInsert(item.table_name, data);
      case 'UPDATE':
        await this.syncUpdate(item.table_name, item.record_id, data);
        return true;
      case 'DELETE':
        await this.syncDelete(item.table_name, item.record_id);
        return true;
      default:
        console.warn(`Unknown operation: ${item.operation}`);
        return true;
    }
  }

  /**
   * Sync an INSERT operation.
   * Treat duplicate/conflict errors as "already synced" so they
   * don't keep retrying.
   *
   * Returns true if the item should be marked as synced.
   */
  private async syncInsert(tableName: string, data: any): Promise<boolean> {
    const safeData = this.sanitizeData(tableName, data);
    const { error } = await supabase.from(tableName).insert(safeData);

    if (error) {
      const msg = (error.message || '').toLowerCase();
      const code = (error as any).code as string | undefined;

      const isConflict =
        code === '23505' || // Postgres unique_violation
        code === 'PGRST116' || // PostgREST conflict
        msg.includes('duplicate') ||
        msg.includes('conflict');

      if (isConflict) {
        console.warn(
          `⚠️ Conflict inserting into ${tableName} (already exists); treating as synced.`
        );
        // Item already exists remotely; mark queue row as synced.
        return true;
      }

      // Real error – keep in queue, let caller update retry_count.
      throw error;
    }

    console.log(`✅ Synced INSERT to ${tableName}`);
    return true;
  }

  /**
   * Sync an UPDATE operation
   */
  private async syncUpdate(
    tableName: string,
    recordId: string,
    data: any
  ): Promise<void> {
    const safeData = this.sanitizeData(tableName, data);

    const { error } = await supabase
      .from(tableName)
      .update(safeData)
      .eq('id', recordId);

    if (error) {
      throw error;
    }

    console.log(`✅ Synced UPDATE to ${tableName}`);
  }

  /**
   * Sync a DELETE operation
   */
  private async syncDelete(tableName: string, recordId: string): Promise<void> {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', recordId);

    if (error) {
      throw error;
    }

    console.log(`✅ Synced DELETE to ${tableName}`);
  }

  /**
   * Start automatic periodic sync
   */
  startPeriodicSync(userId: string, intervalMs: number = 60000): void {
    if (this.syncInterval) {
      this.stopPeriodicSync();
    }

    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncAll(userId).catch((err) => {
          console.error('Periodic sync error:', err);
        });
      }
    }, intervalMs);

    console.log(`🔄 Started periodic sync (every ${intervalMs / 1000}s)`);
  }

  /**
   * Stop automatic periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Stopped periodic sync');
    }
  }

  /**
   * Clear sync queue for a user
   */
  clearSyncQueue(userId: string): void {
    sqliteService.run(`DELETE FROM sync_queue WHERE user_id = ?`, [userId]);
    console.log('🗑️ Cleared sync queue');
  }

  /**
   * Get pending sync count
   */
  getPendingSyncCount(userId: string): number {
    const result = sqliteService.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count
         FROM sync_queue
        WHERE user_id = ?
          AND synced = 0`,
      [userId]
    );
    return result?.count || 0;
  }
}

// Export singleton instance
export const syncService = new SyncService();
