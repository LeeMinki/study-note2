function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyInlineMarkdown(value) {
  return value
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%" />')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderBlock(block) {
  const lines = block.split("\n");

  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    const items = lines
      .map((line) => line.replace(/^[-*]\s+/, ""))
      .map((line) => `<li>${applyInlineMarkdown(line)}</li>`)
      .join("");

    return `<ul>${items}</ul>`;
  }

  if (lines.length === 1) {
    const line = lines[0];

    if (line.startsWith("### ")) {
      return `<h3>${applyInlineMarkdown(line.slice(4))}</h3>`;
    }

    if (line.startsWith("## ")) {
      return `<h2>${applyInlineMarkdown(line.slice(3))}</h2>`;
    }

    if (line.startsWith("# ")) {
      return `<h1>${applyInlineMarkdown(line.slice(2))}</h1>`;
    }
  }

  return `<p>${lines.map((line) => applyInlineMarkdown(line)).join("<br />")}</p>`;
}

export default function renderMarkdown(markdown) {
  const normalized = escapeHtml(markdown || "").replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return "<p>No content yet.</p>";
  }

  return normalized
    .split(/\n{2,}/)
    .map((block) => renderBlock(block))
    .join("");
}
