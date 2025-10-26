// Snowflake SDK type definitions
export interface SnowflakeConnection {
  connect(callback: (err: SnowflakeError | null) => void): void;
  execute(options: ExecuteOptions): void;
  destroy(callback: (err: SnowflakeError | null) => void): void;
}

export interface SnowflakeError {
  code: string;
  message: string;
  sqlState?: string;
}

export interface ExecuteOptions {
  sqlText: string;
  binds?: unknown[];
  complete: (err: SnowflakeError | null, stmt: Statement | null, rows: unknown[]) => void;
}

export interface Statement {
  getStatementId(): string;
  getSqlText(): string;
  getStatus(): string;
}

export interface SnowflakeConnectionConfig {
  account: string;
  username: string;
  password?: string;
  privateKey?: string;
  warehouse: string;
  database: string;
  schema: string;
  role: string;
  authenticator?: string;
}

// Database record interfaces
export interface VehicleRecord {
  VEHICLE_ID: string;
  VIN: string;
  YEAR?: string;
  MAKE?: string;
  MODEL?: string;
  CAP_COST: string | number;
  LIFE_TO_DATE_REPAIR_COST: string | number;
  SCHEDULED_REPLACEMENT?: string;
  REPLACEMENT_DATE?: string;
  TENANT_ID: string;
}

export interface ABMRecord {
  SCHEDULED_REPLACEMENT: string;
  REPLACEMENT_DATE?: string;
  REPLACEMENT_REASON?: string;
}

export interface FleetCostRecord {
  VEHICLE_ID: string;
  VIN: string;
  YEAR?: string;
  MAKE?: string;
  MODEL?: string;
  CAP_COST: number;
  LIFE_TO_DATE_REPAIR_COST: number;
  COST_STATUS: 'CRITICAL' | 'CAUTION' | 'MODERATE' | 'GOOD';
  COST_PERCENTAGE: number;
  TENANT_ID: string;
}

export interface CountRecord {
  TOTAL: number;
}