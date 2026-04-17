const DEFAULT_API_BASE = "http://localhost:3001";

export function normalizeApiBase(rawBase = DEFAULT_API_BASE) {
  const trimmedBase = rawBase.trim();

  if (trimmedBase === "/") {
    return "";
  }

  return trimmedBase.replace(/\/+$/, "");
}

export function getApiBase() {
  const runtimeEnv = import.meta.env || {};
  const rawBase = runtimeEnv.VITE_API_BASE_URL || DEFAULT_API_BASE;

  return normalizeApiBase(rawBase);
}

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${normalizedPath}`;
}
