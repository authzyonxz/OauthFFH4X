import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import "dotenv/config";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const hash = await bcrypt.hash("RUAN00", 12);

const [rows] = await conn.execute("SELECT id FROM app_users WHERE username = 'RUAN'");
if (rows.length === 0) {
  await conn.execute(
    "INSERT INTO app_users (username, password_hash, role, credits) VALUES (?, ?, 'admin', 999999)",
    ["RUAN", hash]
  );
  console.log("✅ Admin RUAN criado com sucesso");
} else {
  await conn.execute(
    "UPDATE app_users SET password_hash = ?, role = 'admin', credits = 999999 WHERE username = 'RUAN'",
    [hash]
  );
  console.log("✅ Admin RUAN atualizado");
}
await conn.end();
