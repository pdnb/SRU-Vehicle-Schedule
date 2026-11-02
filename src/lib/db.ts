import "server-only";
import oracledb from "oracledb";

declare global {
  var __promisPool: Promise<oracledb.Pool> | undefined;
  var __oracleThickInit: boolean | undefined;
}

/** Schema name is interpolated into SQL, so only allow a plain Oracle identifier. */
export function promisSchema(): string {
  const schema = process.env.ORACLE_SCHEMA || "PROMIS";
  if (!/^[A-Za-z][A-Za-z0-9_$#]{0,127}$/.test(schema)) {
    throw new Error("ORACLE_SCHEMA is not a valid identifier");
  }
  return schema.toUpperCase();
}

function getPool(): Promise<oracledb.Pool> {
  if (!globalThis.__promisPool) {
    if (process.env.ORACLE_CLIENT_DIR && !globalThis.__oracleThickInit) {
      oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_DIR });
      globalThis.__oracleThickInit = true;
    }
    globalThis.__promisPool = oracledb
      .createPool({
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: process.env.ORACLE_CONNECT_STRING,
        poolMin: 0,
        poolMax: 4,
        poolIncrement: 1,
      })
      .catch((err) => {
        // Let the next request retry instead of caching a failed pool
        globalThis.__promisPool = undefined;
        throw err;
      });
  }
  return globalThis.__promisPool;
}

export async function query<T>(sql: string, binds: oracledb.BindParameters = {}): Promise<T[]> {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    const result = await conn.execute<T>(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return result.rows ?? [];
  } finally {
    await conn.close();
  }
}
