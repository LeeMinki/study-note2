function padNumber(value) {
  return String(value).padStart(2, "0");
}

function createTimestamp(date = new Date()) {
  return new Date(date).toISOString();
}

function compareCreatedAtDescending(leftNote, rightNote) {
  const leftTime = new Date(leftNote.createdAt).getTime();
  const rightTime = new Date(rightNote.createdAt).getTime();

  if (leftTime !== rightTime) {
    return rightTime - leftTime;
  }

  const leftUpdatedTime = new Date(leftNote.updatedAt).getTime();
  const rightUpdatedTime = new Date(rightNote.updatedAt).getTime();

  if (leftUpdatedTime !== rightUpdatedTime) {
    return rightUpdatedTime - leftUpdatedTime;
  }

  return String(rightNote.id).localeCompare(String(leftNote.id));
}

function formatDisplayDate(value) {
  const date = new Date(value);

  return [
    date.getFullYear(),
    ". ",
    padNumber(date.getMonth() + 1),
    ". ",
    padNumber(date.getDate()),
    ". ",
    padNumber(date.getHours()),
    ":",
    padNumber(date.getMinutes()),
  ].join("");
}

module.exports = {
  createTimestamp,
  compareCreatedAtDescending,
  formatDisplayDate,
};
