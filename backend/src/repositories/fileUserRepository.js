const fs = require("node:fs/promises");
const path = require("node:path");

const dataFilePath = path.resolve(__dirname, "../../users.json");
const tempFilePath = `${dataFilePath}.tmp`;
const emptyUsersDocument = { users: [] };

async function ensureUsersFile() {
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await writeUsersDocument(emptyUsersDocument);
  }
}

async function readUsersDocument() {
  await ensureUsersFile();

  const rawContent = await fs.readFile(dataFilePath, "utf8");
  if (!rawContent.trim()) {
    // hostPath가 빈 파일만 만든 경우 첫 요청에서 안전하게 초기화한다.
    await writeUsersDocument(emptyUsersDocument);
    return { ...emptyUsersDocument, users: [...emptyUsersDocument.users] };
  }

  const parsed = JSON.parse(rawContent);

  if (!parsed || !Array.isArray(parsed.users)) {
    throw new Error("Invalid users data file.");
  }

  return parsed;
}

async function writeUsersDocument(document) {
  const serialized = JSON.stringify(document, null, 2);
  await fs.writeFile(tempFilePath, serialized);
  await fs.rename(tempFilePath, dataFilePath);
}

async function findUserByEmail(email) {
  const document = await readUsersDocument();
  return document.users.find((user) => user.email === email) || null;
}

async function findUserById(userId) {
  const document = await readUsersDocument();
  return document.users.find((user) => user.id === userId) || null;
}

async function saveUser(user) {
  const document = await readUsersDocument();
  document.users.push(user);
  await writeUsersDocument(document);
  return user;
}

async function updateUser(nextUser) {
  const document = await readUsersDocument();
  const targetIndex = document.users.findIndex((user) => user.id === nextUser.id);

  if (targetIndex === -1) {
    throw new Error("User not found.");
  }

  document.users[targetIndex] = nextUser;
  await writeUsersDocument(document);
  return nextUser;
}

module.exports = {
  findUserByEmail,
  findUserById,
  saveUser,
  updateUser,
};
