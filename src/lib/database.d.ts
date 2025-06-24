// database.js の型定義
declare class DatabaseManager {
  constructor();
  run(sql: string, ...params: unknown[]): unknown;
  get(sql: string, ...params: unknown[]): unknown;
  all(sql: string, ...params: unknown[]): unknown[];
  initialize(): Promise<void>;
  close(): void;
}

declare const _default: typeof DatabaseManager;
export = _default;
