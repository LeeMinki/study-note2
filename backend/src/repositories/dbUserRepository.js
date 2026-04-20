const { getDb } = require("../db");

// DB row(snake_case) → 애플리케이션 객체(camelCase) 변환
function rowToUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    provider: row.provider,
    providerId: row.provider_id ?? null,
    createdAt: row.created_at,
  };
}

function findUserByEmail(email) {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase());
  return row ? rowToUser(row) : null;
}

function findUserById(userId) {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(userId);
  return row ? rowToUser(row) : null;
}

function saveUser(user) {
  getDb()
    .prepare(
      `INSERT INTO users (id, email, name, display_name, password_hash, provider, provider_id, created_at)
       VALUES (@id, @email, @name, @displayName, @passwordHash, @provider, @providerId, @createdAt)`
    )
    .run({
      id: user.id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      passwordHash: user.passwordHash ?? null,
      provider: user.provider ?? "local",
      providerId: user.providerId ?? null,
      createdAt: user.createdAt,
    });
  return user;
}

function updateUser(nextUser) {
  const result = getDb()
    .prepare(
      `UPDATE users
         SET name = @name,
             display_name = @displayName,
             password_hash = @passwordHash,
             provider = @provider,
             provider_id = @providerId
       WHERE id = @id`
    )
    .run({
      id: nextUser.id,
      name: nextUser.name,
      displayName: nextUser.displayName,
      passwordHash: nextUser.passwordHash ?? null,
      provider: nextUser.provider ?? "local",
      providerId: nextUser.providerId ?? null,
    });

  if (result.changes === 0) {
    throw new Error("User not found.");
  }

  return nextUser;
}

module.exports = {
  findUserByEmail,
  findUserById,
  saveUser,
  updateUser,
};
