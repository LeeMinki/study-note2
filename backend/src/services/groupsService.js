const { createGroup, createNormalizedName, normalizeGroupId, updateGroup } = require("../models/group");
const {
  deleteGroupForUser,
  findGroupByUserIdAndId,
  findGroupByUserIdAndNormalizedName,
  findGroupsByUserId,
  insertGroup,
  updateGroup: dbUpdateGroup,
} = require("../repositories/dbGroupRepository");

function removeInternalFields(group) {
  if (!group) {
    return group;
  }

  const { normalizedName, ...publicGroup } = group;
  return publicGroup;
}

async function listGroups(userId) {
  return findGroupsByUserId(userId).map(removeInternalFields);
}

function ensureUniqueGroupName(userId, normalizedName, currentGroupId = null) {
  const existing = findGroupByUserIdAndNormalizedName(userId, normalizedName);
  if (existing && existing.id !== currentGroupId) {
    throw new Error("Group already exists.");
  }
}

async function createGroupRecord(input, userId) {
  const nextGroup = createGroup(input, userId);
  ensureUniqueGroupName(userId, nextGroup.normalizedName);
  return removeInternalFields(insertGroup(nextGroup));
}

async function renameGroupRecord(groupId, input, userId) {
  const normalizedGroupId = normalizeGroupId(groupId);
  if (!normalizedGroupId) {
    throw new Error("Invalid group id.");
  }

  const existing = findGroupByUserIdAndId(userId, normalizedGroupId);
  if (!existing) {
    throw new Error("Group not found.");
  }

  const normalizedName = createNormalizedName(input.name);
  ensureUniqueGroupName(userId, normalizedName, normalizedGroupId);

  const nextGroup = updateGroup(existing, input);
  return removeInternalFields(dbUpdateGroup(nextGroup));
}

async function deleteGroupRecord(groupId, userId) {
  const normalizedGroupId = normalizeGroupId(groupId);
  if (!normalizedGroupId) {
    throw new Error("Invalid group id.");
  }

  return deleteGroupForUser(userId, normalizedGroupId);
}

module.exports = {
  createGroupRecord,
  deleteGroupRecord,
  listGroups,
  removeInternalFields,
  renameGroupRecord,
};
