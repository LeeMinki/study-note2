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
  const isHtml = /<[a-z][a-z0-9]*[\s>]/i.test(content);
  const plain = isHtml ? stripHtml(content) : stripMarkdownSyntax(content);
  if (!plain) {
    // 텍스트가 없어도 이미지가 있으면 표시
    if (isHtml && /<img/i.test(content)) return "[이미지]";
    if (!isHtml && /!\[/.test(content)) return "[이미지]";
    return "";
  }
  return plain.length <= maxLength ? plain : `${plain.slice(0, maxLength).trim()}...`;
}
