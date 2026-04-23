import renderMarkdown from "./renderMarkdown";

export function isRichContent(content) {
  if (!content) return false;
  return /<[a-z][a-z0-9]*[\s>]/i.test(content);
}

export function renderContent(content) {
  if (!content) return "";
  if (isRichContent(content)) return content;
  return renderMarkdown(content);
}
