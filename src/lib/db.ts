import mysql, {
  Pool,
  PoolOptions,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

type SqlParam = string | number | boolean | Date | null | Buffer;

let pool: Pool | null = null;

function getConfig(): PoolOptions {
  const host = process.env.MYSQL_HOST?.trim();
  const user = process.env.MYSQL_USER?.trim();
  const password = process.env.MYSQL_PASSWORD ?? "";
  const database = process.env.MYSQL_DATABASE?.trim();
  const port = Number(process.env.MYSQL_PORT || 3306);

  if (!host || !user || !database) {
    throw new Error(
      "Falta configurar MySQL. Completa MYSQL_HOST, MYSQL_USER y MYSQL_DATABASE en .env.local (hostname de Hostinger Remote MySQL).",
    );
  }

  return {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 8,
    timezone: "Z",
    dateStrings: true,
  };
}

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(getConfig());
  }
  return pool;
}

export async function queryRows<T extends RowDataPacket>(
  sql: string,
  params: SqlParam[] = [],
): Promise<T[]> {
  const [rows] = await getPool().execute<T[]>(sql, params);
  return rows;
}

export async function queryOne<T extends RowDataPacket>(
  sql: string,
  params: SqlParam[] = [],
): Promise<T | null> {
  const rows = await queryRows<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  params: SqlParam[] = [],
): Promise<ResultSetHeader> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result;
}

export async function ensureRolesTable(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS roles (
      id int(11) NOT NULL AUTO_INCREMENT,
      nombre varchar(50) NOT NULL,
      descripcion varchar(200) DEFAULT NULL,
      estado tinyint(1) DEFAULT 1,
      PRIMARY KEY (id),
      UNIQUE KEY nombre (nombre)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const count = await queryOne<RowDataPacket & { c: number }>(
    "SELECT COUNT(*) AS c FROM roles",
  );
  if ((count?.c ?? 0) === 0) {
    await execute(
      `INSERT INTO roles (nombre, descripcion, estado) VALUES
        ('ADMIN', 'Acceso total al sistema', 1),
        ('VENDEDOR', 'Registro y consulta de ventas', 1),
        ('CAJERO', 'Operación de caja y ventas', 1)`,
    );
  }
}
