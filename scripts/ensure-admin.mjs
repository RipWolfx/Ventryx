import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const config = {
  host: process.env.MYSQL_HOST || "auth-db1069.hstgr.io",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "u340197236_Proyecto_Final",
  password: process.env.MYSQL_PASSWORD || "6TZq6p-A)+Z46Y3",
  database: process.env.MYSQL_DATABASE || "u340197236_RSK_SISTEM",
  connectTimeout: 20000,
};

async function main() {
  const conn = await mysql.createConnection(config);
  console.log("CONNECTED_OK");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS roles (
      id int(11) NOT NULL AUTO_INCREMENT,
      nombre varchar(50) NOT NULL,
      descripcion varchar(200) DEFAULT NULL,
      estado tinyint(1) DEFAULT 1,
      PRIMARY KEY (id),
      UNIQUE KEY nombre (nombre)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.execute(`
    INSERT INTO roles (nombre, descripcion, estado) VALUES
      ('ADMIN', 'Acceso total al sistema', 1),
      ('VENDEDOR', 'Registro y consulta de ventas', 1),
      ('CAJERO', 'Operacion de caja y ventas', 1)
    ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion)
  `);

  const hash = await bcrypt.hash("1234", 10);
  const [existing] = await conn.execute(
    "SELECT id, username FROM usuarios WHERE username = ? LIMIT 1",
    ["admin"],
  );

  if (existing.length) {
    await conn.execute(
      "UPDATE usuarios SET password = ?, rol = ?, estado = 1 WHERE username = ?",
      [hash, "ADMIN", "admin"],
    );
    console.log("ADMIN_UPDATED", existing[0].id);
  } else {
    const [result] = await conn.execute(
      "INSERT INTO usuarios (username, password, rol, estado) VALUES (?, ?, ?, 1)",
      ["admin", hash, "ADMIN"],
    );
    console.log("ADMIN_CREATED", result.insertId);
  }

  const [users] = await conn.execute(
    "SELECT id, username, rol, estado FROM usuarios",
  );
  console.log("USERS", JSON.stringify(users));
  const [roles] = await conn.execute("SELECT id, nombre, estado FROM roles");
  console.log("ROLES", JSON.stringify(roles));
  await conn.end();
}

main().catch((e) => {
  console.error("ERROR", e.code || "", e.message);
  process.exit(1);
});
