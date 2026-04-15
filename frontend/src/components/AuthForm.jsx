import { useEffect, useState } from "react";

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
          <h1>Capture fast. Find faster.</h1>
          <p className="heroText">
            Keep development notes lightweight, searchable, and easy to edit in place.
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
        </div>
      </div>
    </main>
  );
}
