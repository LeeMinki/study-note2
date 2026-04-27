const { getDb } = require("../db");

function rowToGroup(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    normalizedName: row.normalized_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function findGroupsByUserId(userId) {
  return getDb()
    .prepare("SELECT * FROM groups WHERE user_id = ? ORDER BY name COLLATE NOCASE ASC")
    .all(userId)
    .map(rowToGroup);
}

function findGroupById(groupId) {
  const row = getDb()
    .prepare("SELECT * FROM groups WHERE id = ?")
    .get(groupId);
  return row ? rowToGroup(row) : null;
}

function findGroupByUserIdAndId(userId, groupId) {
  const row = getDb()
    .prepare("SELECT * FROM groups WHERE user_id = ? AND id = ?")
    .get(userId, groupId);
  return row ? rowToGroup(row) : null;
}

function findGroupByUserIdAndNormalizedName(userId, normalizedName) {
  const row = getDb()
    .prepare("SELECT * FROM groups WHERE user_id = ? AND normalized_name = ?")
    .get(userId, normalizedName);
  return row ? rowToGroup(row) : null;
}

function insertGroup(group) {
  getDb()
    .prepare(
      `INSERT INTO groups (id, user_id, name, normalized_name, created_at, updated_at)
       VALUES (@id, @userId, @name, @normalizedName, @createdAt, @updatedAt)`
    )
    .run(group);
  return group;
}

function updateGroup(group) {
  const result = getDb()
    .prepare(
      `UPDATE groups
         SET name = @name,
             normalized_name = @normalizedName,
             updated_at = @updatedAt
       WHERE id = @id AND user_id = @userId`
    )
    .run(group);

  if (result.changes === 0) {
    throw new Error("Group not found.");
  }

  return group;
}

function deleteGroupForUser(userId, groupId) {
  const transaction = getDb().transaction(() => {
    const existing = findGroupByUserIdAndId(userId, groupId);
    if (!existing) {
      throw new Error("Group not found.");
    }

    const unassignResult = getDb()
      .prepare("UPDATE notes SET group_id = NULL WHERE user_id = ? AND group_id = ?")
      .run(userId, groupId);

    getDb()
      .prepare("DELETE FROM groups WHERE user_id = ? AND id = ?")
      .run(userId, groupId);

    return {
      id: groupId,
      unassignedNoteCount: unassignResult.changes,
    };
  });

  return transaction();
}

module.exports = {
  findGroupsByUserId,
  findGroupById,
  findGroupByUserIdAndId,
  findGroupByUserIdAndNormalizedName,
  insertGroup,
  updateGroup,
  deleteGroupForUser,
};
