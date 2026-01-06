// SQLite Service Layer for Offline Database
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import sqliteSchema from './sqlite-schema.sql?raw';
import { loadSQLiteFile, saveSQLiteFile } from './indexeddb-storage';

class SQLiteService {
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the SQLite database (idempotent)
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    try {
      this.SQL = await initSqlJs({
        // ensure sql-wasm.wasm is available at /sql-wasm.wasm (public/)
        locateFile: () => `/sql-wasm.wasm`,
      });

      const savedDb = await loadSQLiteFile();

      if (savedDb) {
        this.db = new this.SQL.Database(savedDb);
        console.log('✅ SQLite database loaded from IndexedDB');
      } else {
        this.db = new this.SQL.Database();
        this.db.exec(sqliteSchema);
        await this.save();
        console.log('✅ SQLite database created and initialized');
      }

      try {
        localStorage.removeItem('joygrow_sqlite_db');
      } catch {
        // ignore
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize SQLite:', error);
      this.db = null;
      this.SQL = null;
      this.initialized = false;
      this.initPromise = null;
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
      const data = this.db.export();
      await saveSQLiteFile(data);
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  /**
   * Execute a SQL query (read/write) and auto-save
   */
  async exec(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    try {
      const results = this.db.exec(sql, params);
      await this.save();
      return results;
    } catch (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  }

  /**
   * Run a read-only query and return results as objects
   */
  query<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    try {
      const stmt = this.db.prepare(sql);
      if (params && params.length > 0) {
        stmt.bind(params);
      }

      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
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
  queryOne<T = any>(sql: string, params: any[] = []): T | null {
    const results = this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Run a write query (INSERT/UPDATE/DELETE) and auto-save
   */
  async run(sql: string, params: any[] = []): Promise<void> {
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
   * Generate a UUID v4 (not crypto-strong, but fine for local ids)
   */
  generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  boolToInt(value: boolean): number {
    return value ? 1 : 0;
  }

  intToBool(value: number): boolean {
    return value === 1;
  }

  /**
   * Clear all user-scoped data (for logout)
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
   * Reset entire DB (dangerous)
   */
  async reset(): Promise<void> {
    if (!this.SQL) {
      throw new Error('SQL.js not initialized');
    }
    if (this.db) {
      this.db.close();
    }
    this.db = new this.SQL.Database();
    this.db.exec(sqliteSchema);
    await this.save();
    console.log('✅ Database reset complete');
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initialized = false;
    this.initPromise = null;
  }

  getDatabase(): Database | null {
    return this.db;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// singleton
export const sqliteService = new SQLiteService();

// expose for debugging
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).sqliteService = sqliteService;

export { SQLiteService };
