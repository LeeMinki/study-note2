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
    // 빈 저장소 첫 로그인은 쓰기 없이 빈 문서로 처리해 마운트 파일 잠금 영향을 피한다.
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
  try {
    await fs.rename(tempFilePath, dataFilePath);
  } catch (error) {
    if (error.code !== "EBUSY" && error.code !== "EXDEV") {
      throw error;
    }

    // Kubernetes subPath 파일 마운트는 rename 교체가 막힐 수 있어 직접 쓰기로 보정한다.
    await fs.writeFile(dataFilePath, serialized);
    await fs.rm(tempFilePath, { force: true });
  }
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
