import { useState, useEffect } from "react";
import useKeyboardSave from "../hooks/useKeyboardSave";
import useDraftNote, { loadDraft, clearDraft } from "../hooks/useDraftNote";
import RichEditor from "./RichEditor";

const initialFormState = {
  title: "",
  content: "",
  tags: "",
};

const LAYOUT_LABELS = {
  narrow: "좁게",
  default: "기본",
  wide: "넓게",
};

export default function NoteComposer({ onCreate, disabled, layoutMode = "default", onToggleLayout, onSetLayout }) {
  const [formState, setFormState] = useState(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [draftBanner, setDraftBanner] = useState(false);
  const [draftEnabled, setDraftEnabled] = useState(true);

  useEffect(() => {
    const draft = loadDraft();
    if (draft && (draft.title || draft.content || draft.tags)) {
      setDraftBanner(true);
    }
  }, []);

  useDraftNote({
    title: formState.title,
    content: formState.content,
    tags: formState.tags,
    enabled: draftEnabled,
  });

  async function handleSubmit() {
    if (!formState.title.trim()) {
      setErrorMessage("제목은 필수입니다.");
      return;
    }
    setErrorMessage("");
    await onCreate(formState);
    clearDraft();
    setDraftEnabled(false);
    setFormState(initialFormState);
    setDraftBanner(false);
    setTimeout(() => setDraftEnabled(true), 0);
  }

  const handleKeyDown = useKeyboardSave(handleSubmit);

  function updateField(name, value) {
    setFormState((s) => ({ ...s, [name]: value }));
  }

  function handleRestoreDraft() {
    const draft = loadDraft();
    if (draft) {
      setFormState({
        title: draft.title || "",
        content: draft.content || "",
        tags: draft.tags || "",
      });
    }
    setDraftBanner(false);
  }

  function handleDiscardDraft() {
    clearDraft();
    setDraftBanner(false);
  }

  return (
    <section className={`panel composerPanel${layoutMode === "wide" ? " composerPanel--wide" : ""}`}>
      <div className="sectionHeading">
        <div>
          <h2>새 노트</h2>
          <p>Ctrl/Cmd + Enter로 빠르게 저장</p>
        </div>
        {onSetLayout ? (
          <div className="layoutSelector" role="group" aria-label="레이아웃 선택">
            {["narrow", "default", "wide"].map((mode) => (
              <button
                key={mode}
                type="button"
                className={`layoutToggleButton${layoutMode === mode ? " layoutToggleButton--active" : ""}`}
                onClick={() => onSetLayout(mode)}
                aria-pressed={layoutMode === mode}
                aria-label={`${LAYOUT_LABELS[mode]} 레이아웃`}
              >
                {LAYOUT_LABELS[mode]}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {draftBanner ? (
        <div className="draftBanner">
          <span>이전에 작성 중이던 내용이 있습니다.</span>
          <div className="draftBannerActions">
            <button type="button" className="ghostButton" onClick={handleRestoreDraft}>
              복원
            </button>
            <button type="button" className="dangerButton" onClick={handleDiscardDraft}>
              삭제
            </button>
          </div>
        </div>
      ) : null}

      <input
        className="textInput"
        value={formState.title}
        onChange={(e) => updateField("title", e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="제목"
        disabled={disabled}
      />

      <RichEditor
        value={formState.content}
        onChange={(html) => updateField("content", html)}
        disabled={disabled}
        placeholder="내용을 입력하세요"
        minHeight="260px"
      />

      <input
        className="textInput"
        value={formState.tags}
        onChange={(e) => updateField("tags", e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="태그 (쉼표로 구분)"
        disabled={disabled}
      />

      {errorMessage ? <p className="errorText">{errorMessage}</p> : null}

      <div className="composerActions">
        <button className="primaryButton" type="button" onClick={handleSubmit} disabled={disabled}>
          저장
        </button>
      </div>
    </section>
  );
}
