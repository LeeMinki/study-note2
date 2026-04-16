import { buildApiUrl } from "./apiBase";

const TOKEN_KEY = "study-note-token";

async function requestAuth(path, { method = "GET", body, includeAuth = false } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildApiUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();

  return {
    status: response.status,
    json,
  };
}

// 회원가입 후 { token, user } 반환
export async function registerUser({ name, displayName, email, password }) {
  return requestAuth("/api/auth/register", {
    method: "POST",
    body: { name, displayName, email, password },
  });
}

// 로그인 후 { token, user } 반환
export async function loginUser({ email, password }) {
  return requestAuth("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function fetchCurrentUser() {
  return requestAuth("/api/auth/me", { includeAuth: true });
}

export async function updateCurrentUser(profileInput) {
  return requestAuth("/api/auth/me", {
    method: "PATCH",
    includeAuth: true,
    body: profileInput,
  });
}

export async function updateCurrentUserPassword(passwordInput) {
  return requestAuth("/api/auth/me/password", {
    method: "PATCH",
    includeAuth: true,
    body: passwordInput,
  });
}
