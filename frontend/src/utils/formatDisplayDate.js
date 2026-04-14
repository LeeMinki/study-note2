function padNumber(value) {
  return String(value).padStart(2, "0");
}

export default function formatDisplayDate(value) {
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
