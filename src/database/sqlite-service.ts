// SQLite Service Layer for Offline Database
import initSqlJs, { Database } from 'sql.js';
import sqliteSchema from './sqlite-schema.sql?raw';

// use the shared IndexedDB helpers
import { loadSQLiteFile, saveSQLiteFile } from './indexeddb-storage';

class SQLiteService {
  private db: Database | null = null;
  private SQL: any = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the SQLite database
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    try {
      // Initialize SQL.js - load wasm from local assets instead of remote CDN
      this.SQL = await initSqlJs({
        // IMPORTANT: ensure sql-wasm.wasm is copied to /public/sql-wasm.wasm
        locateFile: (file) => `/sql-wasm.wasm`,
      });

      // Try to load existing database from IndexedDB
      const savedDb = await loadSQLiteFile();

      if (savedDb) {
        this.db = new this.SQL!.Database(savedDb);
        console.log('✅ SQLite database loaded from IndexedDB');
      } else {
        // Create new database
        this.db = new this.SQL!.Database();
        // Run schema initialization
        this.db!.exec(sqliteSchema);
        // Save to IndexedDB
        await this.save();
        console.log('✅ SQLite database created and initialized');
      }

      // Optional: clear old localStorage snapshot if present
      try {
        localStorage.removeItem('joygrow_sqlite_db');
      } catch {
        // ignore
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize SQLite:', error);
      throw error;
    }
  }

  /**
   * Save the database to IndexedDB
   */
  async save(): Promise<void> {
    if (!this.db) {
      console.error('Database not initialized');
      return;
    }

    try {
      const data = this.db.export(); // Uint8Array
      await saveSQLiteFile(data);
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  /**
   * Execute a SQL query
   */
  async exec(sql: string, params?: any[]): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    try {
      const results = this.db.exec(sql, params);
      await this.save(); // Auto-save after each operation
      return results;
    } catch (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  }

  /**
   * Run a query and return results as objects
   *
   * NOTE: does not auto-save, only reads.
   */
  query<T = any>(sql: string, params?: any[]): T[] {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    try {
      const stmt = this.db.prepare(sql);
      if (params) {
        stmt.bind(params);
      }

      const results: T[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push(row as T);
      }
      stmt.free();

      return results;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * Run a query and return a single result
   */
  queryOne<T = any>(sql: string, params?: any[]): T | null {
    const results = this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Run a query that modifies data (INSERT, UPDATE, DELETE)
   */
  async run(sql: string, params?: any[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    try {
      this.db.run(sql, params);
      await this.save();
    } catch (error) {
      console.error('Run error:', error);
      throw error;
    }
  }

  /**
   * Generate a UUID v4
   */
  generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Convert boolean to SQLite integer
   */
  boolToInt(value: boolean): number {
    return value ? 1 : 0;
  }

  /**
   * Convert SQLite integer to boolean
   */
  intToBool(value: number): boolean {
    return value === 1;
  }

  /**
   * Clear all data from database (useful for logout/reset)
   */
  async clearUserData(userId: string): Promise<void> {
    const tables = [
      'quiz_attempts',
      'user_achievements',
      'custom_quizzes',
      'notes',
      'todos',
      'pomodoro_sessions',
      'pomodoro_settings',
      'notifications',
      'activity_logs',
      'sync_queue',
    ];

    for (const table of tables) {
      await this.run(`DELETE FROM ${table} WHERE user_id = ?`, [userId]);
    }
  }

  /**
   * Reset the entire database (WARNING: Deletes all data)
   */
  async reset(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    this.db.close();
    this.db = new this.SQL!.Database();
    this.db!.exec(sqliteSchema);
    await this.save();
    console.log('✅ Database reset complete');
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
      this.initPromise = null;
    }
  }

  /**
   * Get database instance (use with caution)
   */
  getDatabase(): Database | null {
    return this.db;
  }

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const sqliteService = new SQLiteService();

// Expose for debugging in browser console
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).sqliteService = sqliteService;

// Export the class for testing
export { SQLiteService };
