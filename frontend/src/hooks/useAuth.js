import { useCallback, useEffect, useState } from "react";
import {
  fetchCurrentUser,
  registerUser,
  loginUser,
  updateCurrentUser,
  updateCurrentUserPassword,
  startSsoLink,
} from "../services/authApi";

const TOKEN_KEY = "study-note-token";

// 저장된 토큰을 읽어 JWT 만료 여부까지 검증한다. 만료 시 세션 스토리지에서 제거 후 null 반환.
function loadStoredToken() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      sessionStorage.removeItem(TOKEN_KEY);
      return null;
    }
  } catch {
    // 파싱 실패 시 서버 검증에 위임
  }

  return token;
}

export default function useAuth() {
  const [token, setToken] = useState(loadStoredToken);
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(loadStoredToken()));
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const isAuthenticated = Boolean(token);

  const saveSession = useCallback((newToken, user = null) => {
    sessionStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setCurrentUser(user);
  }, []);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCurrentUser(null);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setAuthError("");
  }, [clearSession]);

  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      setIsAuthLoading(false);
      return;
    }

    let cancelled = false;

    async function restoreCurrentUser() {
      setIsAuthLoading(true);

      try {
        const { status, json } = await fetchCurrentUser();

        if (cancelled) {
          return;
        }

        if (!json.success) {
          if (status === 401) {
            clearSession();
            setAuthError("다시 로그인해주세요.");
            return;
          }

          setAuthError(json.error || "사용자 정보를 불러오지 못했습니다.");
          return;
        }

        setCurrentUser(json.data);
        setAuthError("");
      } catch {
        if (!cancelled) {
          setAuthError("서버 연결에 실패했습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsAuthLoading(false);
        }
      }
    }

    restoreCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [token, clearSession]);

  const register = useCallback(async (registerInput) => {
    setIsAuthLoading(true);
    setAuthError("");

    try {
      const { json } = await registerUser(registerInput);

      if (!json.success) {
        setAuthError(json.error || "회원가입에 실패했습니다.");
        return false;
      }

      saveSession(json.data.token, json.data.user);
      return true;
    } catch {
      setAuthError("서버 연결에 실패했습니다.");
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  }, [saveSession]);

  const login = useCallback(async (email, password) => {
    setIsAuthLoading(true);
    setAuthError("");

    try {
      const { json } = await loginUser({ email, password });

      if (!json.success) {
        setAuthError(json.error || "로그인에 실패했습니다.");
        return false;
      }

      saveSession(json.data.token, json.data.user);
      return true;
    } catch {
      setAuthError("서버 연결에 실패했습니다.");
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  }, [saveSession]);

  const updateProfile = useCallback(async (profileInput) => {
    setIsProfileSaving(true);
    setAuthError("");

    try {
      const { status, json } = await updateCurrentUser(profileInput);

      if (!json.success) {
        if (status === 401) {
          clearSession();
          setAuthError("다시 로그인해주세요.");
          return { success: false, error: "다시 로그인해주세요." };
        }

        const nextError = json.error || "프로필 저장에 실패했습니다.";
        setAuthError(nextError);
        return { success: false, error: nextError };
      }

      setCurrentUser(json.data);
      return { success: true, data: json.data };
    } catch {
      const nextError = "서버 연결에 실패했습니다.";
      setAuthError(nextError);
      return { success: false, error: nextError };
    } finally {
      setIsProfileSaving(false);
    }
  }, [clearSession]);

  const loginWithToken = useCallback((newToken) => {
    saveSession(newToken);
  }, [saveSession]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const { json } = await fetchCurrentUser();
      if (json.success) setCurrentUser(json.data);
    } catch {
      // 실패 시 무시 (세션 유지)
    }
  }, [token]);

  const linkGoogle = useCallback(async () => {
    try {
      const { json } = await startSsoLink("google");
      if (json.success && json.data?.authUrl) {
        window.location.href = json.data.authUrl;
      }
    } catch {
      // 호출부에서 에러 처리
    }
  }, []);

  const updatePassword = useCallback(async (passwordInput) => {
    setIsPasswordSaving(true);
    setAuthError("");

    try {
      const { status, json } = await updateCurrentUserPassword(passwordInput);

      if (!json.success) {
        if (status === 401) {
          clearSession();
          setAuthError("다시 로그인해주세요.");
          return { success: false, error: "다시 로그인해주세요." };
        }

        const nextError = json.error || "비밀번호 변경에 실패했습니다.";
        setAuthError(nextError);
        return { success: false, error: nextError };
      }

      return { success: true, data: json.data };
    } catch {
      const nextError = "서버 연결에 실패했습니다.";
      setAuthError(nextError);
      return { success: false, error: nextError };
    } finally {
      setIsPasswordSaving(false);
    }
  }, [clearSession]);

  return {
    isAuthenticated,
    token,
    currentUser,
    authError,
    isAuthLoading,
    isProfileSaving,
    isPasswordSaving,
    login,
    loginWithToken,
    refreshUser,
    linkGoogle,
    register,
    logout,
    updateProfile,
    updatePassword,
  };
}
