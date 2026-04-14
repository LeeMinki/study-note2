import { useState } from "react";

export default function AuthForm({ onLogin, onRegister, errorMessage, isLoading }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (mode === "login") {
      await onLogin(email, password);
    } else {
      await onRegister(email, password);
    }
  }

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
            <label className="authLabel">
              이메일
              <input
                className="textInput"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
                minLength={6}
                required
                disabled={isLoading}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>

            {errorMessage ? <p className="errorText">{errorMessage}</p> : null}

            <button className="primaryButton" type="submit" disabled={isLoading}>
              {isLoading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
