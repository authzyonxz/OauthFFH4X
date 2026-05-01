import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import "dotenv/config";

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  const newUser = "@ruanwq";
  const newPass = "@ruanwq";
  const hash = await bcrypt.hash(newPass, 12);

  console.log("🚀 Iniciando atualização de administrador...");

  // 1. Remover administradores antigos (opcional, mas solicitado pelo usuário)
  // O usuário pediu para remover o atual e criar um novo.
  try {
    const [oldAdmins] = await conn.execute("SELECT username FROM app_users WHERE role = 'admin' AND username != ?", [newUser]);
    for (const admin of oldAdmins) {
      console.log(`🗑️ Removendo administrador antigo: ${admin.username}`);
      await conn.execute("DELETE FROM app_users WHERE username = ?", [admin.username]);
    }
  } catch (err) {
    console.warn("⚠️ Aviso ao remover admins antigos:", err.message);
  }

  // 2. Criar ou atualizar o novo administrador
  const [rows] = await conn.execute("SELECT id FROM app_users WHERE username = ?", [newUser]);
  
  if (rows.length === 0) {
    await conn.execute(
      "INSERT INTO app_users (username, password_hash, role, credits) VALUES (?, ?, 'admin', 999999)",
      [newUser, hash]
    );
    console.log(`✅ Novo Admin ${newUser} criado com sucesso!`);
  } else {
    await conn.execute(
      "UPDATE app_users SET password_hash = ?, role = 'admin', credits = 999999 WHERE username = ?",
      [hash, newUser]
    );
    console.log(`✅ Admin ${newUser} atualizado com novas credenciais!`);
  }

  await conn.end();
}

seed().catch(err => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
