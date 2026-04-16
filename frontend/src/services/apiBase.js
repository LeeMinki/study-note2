const DEFAULT_API_BASE = "http://localhost:3001";

export function getApiBase() {
  const rawBase = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  const trimmedBase = rawBase.trim();

  if (trimmedBase === "/") {
    return "";
  }

  return trimmedBase.replace(/\/+$/, "");
}

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${normalizedPath}`;
}
