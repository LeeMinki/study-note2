import { useEffect, useState } from "react";
import formatDisplayDate from "../utils/formatDisplayDate";

export default function ProfileView({
  currentUser,
  isLoading,
  isSaving,
  errorMessage,
  onBack,
  onLogout,
  onSave,
}) {
  const [name, setName] = useState(currentUser?.name || "");
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
                <dt>인증 방식</dt>
                <dd>{currentUser?.provider || "local"}</dd>
              </div>
            </dl>
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
            {!localError && errorMessage ? <p className="errorText">{errorMessage}</p> : null}
            {successMessage ? <p className="successText">{successMessage}</p> : null}

            <div className="composerActions">
              <button className="primaryButton" type="submit" disabled={isSaving || isLoading}>
                {isSaving ? "저장 중..." : "프로필 저장"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
