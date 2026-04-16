const fs = require("node:fs/promises");
const path = require("node:path");

const dataFilePath = path.resolve(__dirname, "../../data.json");
const tempFilePath = `${dataFilePath}.tmp`;
const emptyNotesDocument = { notes: [] };

async function ensureDataFile() {
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await writeNotesDocument(emptyNotesDocument);
  }
}

async function readNotesDocument() {
  await ensureDataFile();

  const rawContent = await fs.readFile(dataFilePath, "utf8");
  if (!rawContent.trim()) {
    // hostPath가 빈 파일만 만든 경우 첫 요청에서 안전하게 초기화한다.
    await writeNotesDocument(emptyNotesDocument);
    return { ...emptyNotesDocument, notes: [...emptyNotesDocument.notes] };
  }

  const parsedContent = JSON.parse(rawContent);

  if (!parsedContent || !Array.isArray(parsedContent.notes)) {
    throw new Error("Invalid notes data file.");
  }

  return parsedContent;
}

async function writeNotesDocument(document) {
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

async function listNotes() {
  const document = await readNotesDocument();

  return document.notes;
}

async function saveNotes(notes) {
  await writeNotesDocument({ notes });

  return notes;
}

module.exports = {
  listNotes,
  saveNotes,
};
