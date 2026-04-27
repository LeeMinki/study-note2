const { createTimestamp } = require("../utils/dateFormat");

const MAX_GROUP_NAME_LENGTH = 40;
const GROUP_ID_PATTERN = /^group_\d+_[a-z0-9]+$/;

function createGroupId() {
  return `group_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeGroupName(name) {
  if (typeof name !== "string") {
    return "";
  }

  return name.trim();
}

function createNormalizedName(name) {
  return normalizeGroupName(name).toLowerCase();
}

function validateGroupName(name) {
  const trimmedName = normalizeGroupName(name);

  if (!trimmedName) {
    throw new Error("Group name is required.");
  }

  if (trimmedName.length > MAX_GROUP_NAME_LENGTH) {
    throw new Error("Group name is too long.");
  }

  return {
    name: trimmedName,
    normalizedName: createNormalizedName(trimmedName),
  };
}

function normalizeGroupId(groupId) {
  if (groupId === undefined || groupId === null || groupId === "") {
    return null;
  }

  if (typeof groupId !== "string" || !GROUP_ID_PATTERN.test(groupId)) {
    throw new Error("Invalid group id.");
  }

  return groupId;
}

function createGroup(input, userId, now = createTimestamp()) {
  const { name, normalizedName } = validateGroupName(input.name);

  return {
    id: createGroupId(),
    userId,
    name,
    normalizedName,
    createdAt: now,
    updatedAt: now,
  };
}

function updateGroup(currentGroup, input, now = createTimestamp()) {
  const { name, normalizedName } = validateGroupName(input.name);

  return {
    ...currentGroup,
    name,
    normalizedName,
    updatedAt: now,
  };
}

module.exports = {
  createGroup,
  createNormalizedName,
  normalizeGroupId,
  updateGroup,
  validateGroupName,
};
