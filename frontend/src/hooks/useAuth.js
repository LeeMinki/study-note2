import { useState, useCallback } from "react";
import { registerUser, loginUser } from "../services/authApi";

const TOKEN_KEY = "study-note-token";

// 저장된 토큰을 읽어 기본 유효성(존재 여부)을 확인한다
function loadStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export default function useAuth() {
  const [token, setToken] = useState(loadStoredToken);
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const isAuthenticated = Boolean(token);

  const saveToken = useCallback((newToken) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAuthError("");
  }, []);

  const register = useCallback(async (registerInput) => {
    setIsAuthLoading(true);
    setAuthError("");

    try {
      const json = await registerUser(registerInput);

      if (!json.success) {
        setAuthError(json.error || "회원가입에 실패했습니다.");
        return false;
      }

      saveToken(json.data.token);
      return true;
    } catch {
      setAuthError("서버 연결에 실패했습니다.");
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  }, [saveToken]);

  const login = useCallback(async (email, password) => {
    setIsAuthLoading(true);
    setAuthError("");

    try {
      const json = await loginUser({ email, password });

      if (!json.success) {
        setAuthError(json.error || "로그인에 실패했습니다.");
        return false;
      }

      saveToken(json.data.token);
      return true;
    } catch {
      setAuthError("서버 연결에 실패했습니다.");
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  }, [saveToken]);

  return {
    isAuthenticated,
    token,
    authError,
    isAuthLoading,
    login,
    register,
    logout,
  };
}
