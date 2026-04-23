function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripMarkdownSyntax(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function previewText(content, maxLength = 160) {
  if (!content) return "";
  const html = /<[a-z][a-z0-9]*[\s>]/i.test(content);
  const plain = html ? stripHtml(content) : stripMarkdownSyntax(content);
  if (!plain) return "";
  return plain.length <= maxLength ? plain : `${plain.slice(0, maxLength).trim()}...`;
}
