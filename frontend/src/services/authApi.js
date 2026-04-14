const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// 회원가입 후 { token, user } 반환
export async function registerUser({ email, password }) {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return response.json();
}

// 로그인 후 { token, user } 반환
export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return response.json();
}
