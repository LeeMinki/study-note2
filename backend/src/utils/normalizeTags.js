function normalizeSingleTag(tag) {
  if (typeof tag !== "string") {
    return "";
  }

  return tag.trim().toLowerCase();
}

function normalizeTags(input) {
  const rawTags = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(",")
      : [];

  const uniqueTags = new Set();

  for (const rawTag of rawTags) {
    const normalizedTag = normalizeSingleTag(rawTag);

    if (!normalizedTag) {
      continue;
    }

    uniqueTags.add(normalizedTag);
  }

  return Array.from(uniqueTags);
}

module.exports = {
  normalizeSingleTag,
  normalizeTags,
};
