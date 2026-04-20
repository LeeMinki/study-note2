import { useEffect, useState } from "react";
import formatDisplayDate from "../utils/formatDisplayDate";

export default function ProfileView({
  currentUser,
  isLoading,
  isSaving,
  isPasswordSaving,
  errorMessage,
  linkSuccess,
  onLinkGoogle,
  onBack,
  onLogout,
  onSave,
  onPasswordSave,
}) {
  const [name, setName] = useState(currentUser?.name || "");
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [localError, setLocalError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");

  useEffect(() => {
    setName(currentUser?.name || "");
    setDisplayName(currentUser?.displayName || "");
    setLocalError("");
  }, [currentUser]);

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedDisplayName = displayName.trim();

    if (!normalizedName) {
      setLocalError("이름을 입력해주세요.");
      return;
    }

    if (!normalizedDisplayName) {
      setLocalError("표시 이름을 입력해주세요.");
      return;
    }

    setLocalError("");
    setSuccessMessage("");

    const result = await onSave({
      name: normalizedName,
      displayName: normalizedDisplayName,
    });

    if (result.success) {
      setSuccessMessage("프로필이 저장되었습니다.");
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (!currentPassword) {
      setPasswordError("현재 비밀번호를 입력해주세요.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("새 비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setPasswordError("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setPasswordError("");
    setPasswordSuccessMessage("");

    const result = await onPasswordSave({
      currentPassword,
      newPassword,
    });

    if (result.success) {
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setPasswordSuccessMessage("비밀번호가 변경되었습니다.");
    } else if (result.error) {
      setPasswordError(result.error);
    }
  }

  return (
    <main className="appShell">
      <section className="profileShell">
        <header className="profileHero panel">
          <div>
            <p className="eyebrow">Account Profile</p>
            <h1>{currentUser?.displayName || "프로필"}</h1>
            <p className="heroText">계정 기본 정보와 표시 이름을 관리합니다.</p>
          </div>
          <div className="profileHeroActions">
            <button className="ghostButton" type="button" onClick={onBack}>
              메인으로
            </button>
            <button className="ghostButton" type="button" onClick={onLogout}>
              로그아웃
            </button>
          </div>
        </header>

        <section className="profileGrid">
          <div className="panel profileSummary">
            <h2>계정 정보</h2>
            {isLoading ? <p className="noteMeta">불러오는 중...</p> : null}
            <dl className="profileFacts">
              <div>
                <dt>이메일</dt>
                <dd>{currentUser?.email || "-"}</dd>
              </div>
              <div>
                <dt>가입일</dt>
                <dd>{currentUser?.createdAt ? formatDisplayDate(currentUser.createdAt) : "-"}</dd>
              </div>
              <div>
                <dt>로그인 방식</dt>
                <dd>
                  {currentUser?.provider === "google" ? "이메일 + Google" : "이메일"}
                </dd>
              </div>
            </dl>

            <div className="googleLinkSection">
              {currentUser?.provider === "google" ? (
                <p className="googleLinked">
                  <span className="googleLinkedIcon" aria-hidden="true">✓</span>
                  Google 계정이 연결되어 있습니다
                </p>
              ) : (
                <>
                  <p className="googleLinkDesc">Google 계정을 연결하면 이메일/비밀번호와 Google 로그인을 모두 사용할 수 있습니다.</p>
                  <button
                    type="button"
                    className="ssoButton"
                    onClick={onLinkGoogle}
                    disabled={isLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
                    </svg>
                    Google 계정 연결
                  </button>
                </>
              )}
              {linkSuccess ? (
                <p className="successText">Google 계정이 연결되었습니다.</p>
              ) : null}
              {!linkSuccess && errorMessage && currentUser?.provider !== "google" ? (
                <p className="errorText">{errorMessage}</p>
              ) : null}
            </div>
          </div>

          <form className="panel profileEditor" onSubmit={handleSubmit}>
            <div className="sectionHeading">
              <div>
                <h2>프로필 수정</h2>
                <p>이름과 표시 이름만 수정할 수 있습니다.</p>
              </div>
            </div>

            <label className="authLabel">
              이름
              <input
                className="textInput"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isSaving || isLoading}
              />
            </label>

            <label className="authLabel">
              표시 이름
              <input
                className="textInput"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={isSaving || isLoading}
              />
            </label>

            {localError ? <p className="errorText">{localError}</p> : null}
            {successMessage ? <p className="successText">{successMessage}</p> : null}

            <div className="composerActions">
              <button className="primaryButton" type="submit" disabled={isSaving || isLoading}>
                {isSaving ? "저장 중..." : "프로필 저장"}
              </button>
            </div>
          </form>

          <form className="panel profileEditor" onSubmit={handlePasswordSubmit}>
            <div className="sectionHeading">
              <div>
                <h2>비밀번호 변경</h2>
                <p>현재 비밀번호 확인 후 새 비밀번호로 변경합니다.</p>
              </div>
            </div>

            <label className="authLabel">
              현재 비밀번호
              <input
                className="textInput"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                disabled={isPasswordSaving || isLoading}
                autoComplete="current-password"
              />
            </label>

            <label className="authLabel">
              새 비밀번호
              <input
                className="textInput"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={isPasswordSaving || isLoading}
                autoComplete="new-password"
              />
            </label>

            <label className="authLabel">
              새 비밀번호 확인
              <input
                className="textInput"
                type="password"
                value={newPasswordConfirm}
                onChange={(event) => setNewPasswordConfirm(event.target.value)}
                disabled={isPasswordSaving || isLoading}
                autoComplete="new-password"
              />
            </label>

            {passwordError ? <p className="errorText">{passwordError}</p> : null}
            {passwordSuccessMessage ? <p className="successText">{passwordSuccessMessage}</p> : null}

            <div className="composerActions">
              <button className="primaryButton" type="submit" disabled={isPasswordSaving || isLoading}>
                {isPasswordSaving ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
