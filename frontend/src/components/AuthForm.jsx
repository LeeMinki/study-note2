import { useEffect, useState } from "react";
import { getApiBase } from "../services/apiBase";

export default function AuthForm({ onLogin, onRegister, errorMessage, isLoading }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    displayName: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setLocalError("");

    if (mode === "login") {
      setRegisterForm({
        name: "",
        displayName: "",
        email: "",
        password: "",
        passwordConfirm: "",
      });
      return;
    }

    setLoginForm({
      email: "",
      password: "",
    });
  }, [mode]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (mode === "login") {
      setLocalError("");
      await onLogin(loginForm.email, loginForm.password);
    } else {
      const normalizedName = registerForm.name.trim();
      const normalizedDisplayName = registerForm.displayName.trim();

      if (!normalizedName) {
        setLocalError("이름을 입력해주세요.");
        return;
      }

      if (!normalizedDisplayName) {
        setLocalError("표시 이름을 입력해주세요.");
        return;
      }

      if (!registerForm.passwordConfirm) {
        setLocalError("비밀번호 확인을 입력해주세요.");
        return;
      }

      if (registerForm.password !== registerForm.passwordConfirm) {
        setLocalError("비밀번호 확인이 일치하지 않습니다.");
        return;
      }

      setLocalError("");
      await onRegister({
        name: normalizedName,
        displayName: normalizedDisplayName,
        email: registerForm.email,
        password: registerForm.password,
      });
    }
  }

  const visibleErrorMessage = localError || errorMessage;

  return (
    <main className="appShell">
      <section className="hero">
        <div>
          <p className="eyebrow">Study Note</p>
          <h1>Study Note</h1>
          <p className="heroText">
            빠르게 기록하고, 빠르게 찾는 개인 노트 공간
          </p>
        </div>
      </section>

      <div className="authFormWrapper">
        <div className="panel authPanel">
          <div className="authTabBar">
            <button
              type="button"
              className={`authTabButton${mode === "login" ? " authTabButton--active" : ""}`}
              onClick={() => setMode("login")}
            >
              로그인
            </button>
            <button
              type="button"
              className={`authTabButton${mode === "register" ? " authTabButton--active" : ""}`}
              onClick={() => setMode("register")}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="authForm">
            {mode === "register" ? (
              <>
                <label className="authLabel">
                  이름
                  <input
                    className="textInput"
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm((current) => ({ ...current, name: e.target.value }))}
                    placeholder="홍길동"
                    required
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </label>

                <label className="authLabel">
                  표시 이름
                  <input
                    className="textInput"
                    type="text"
                    value={registerForm.displayName}
                    onChange={(e) => setRegisterForm((current) => ({ ...current, displayName: e.target.value }))}
                    placeholder="길동"
                    required
                    disabled={isLoading}
                    autoComplete="nickname"
                  />
                </label>
              </>
            ) : null}

            <label className="authLabel">
              이메일
              <input
                className="textInput"
                type="email"
                value={mode === "login" ? loginForm.email : registerForm.email}
                onChange={(e) => {
                  const value = e.target.value;
                  if (mode === "login") {
                    setLoginForm((current) => ({ ...current, email: value }));
                    return;
                  }
                  setRegisterForm((current) => ({ ...current, email: value }));
                }}
                placeholder="name@example.com"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </label>

            <label className="authLabel">
              비밀번호
              <input
                className="textInput"
                type="password"
                value={mode === "login" ? loginForm.password : registerForm.password}
                onChange={(e) => {
                  const value = e.target.value;
                  if (mode === "login") {
                    setLoginForm((current) => ({ ...current, password: value }));
                    return;
                  }
                  setRegisterForm((current) => ({ ...current, password: value }));
                }}
                placeholder="6자 이상"
                minLength={6}
                required
                disabled={isLoading}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>

            {mode === "register" ? (
              <label className="authLabel">
                비밀번호 확인
                <input
                  className="textInput"
                  type="password"
                  value={registerForm.passwordConfirm}
                  onChange={(e) => setRegisterForm((current) => ({ ...current, passwordConfirm: e.target.value }))}
                  placeholder="비밀번호를 다시 입력"
                  minLength={6}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </label>
            ) : null}

            {visibleErrorMessage ? <p className="errorText">{visibleErrorMessage}</p> : null}

            <button className="primaryButton" type="submit" disabled={isLoading}>
              {isLoading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
            </button>
          </form>

          {mode === "login" ? (
            <>
              <div className="authDivider">
                <span>또는</span>
              </div>
              <a
                className="ssoButton"
                href={`${getApiBase()}/api/auth/sso/google`}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
                </svg>
                Google로 로그인
              </a>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
