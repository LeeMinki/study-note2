import { useState, useEffect } from "react";
import useKeyboardSave from "../hooks/useKeyboardSave";
import useDraftNote, { loadDraft, clearDraft, hasMeaningfulDraft } from "../hooks/useDraftNote";
import RichEditor from "./RichEditor";
import GroupSelect from "./GroupSelect";

const initialFormState = {
  title: "",
  content: "",
  tags: "",
  groupId: null,
};

const LAYOUT_LABELS = {
  narrow: "좁게",
  default: "기본",
  wide: "넓게",
};

export default function NoteComposer({
  onCreate,
  disabled,
  groups = [],
  onCreateGroup,
  layoutMode = "default",
  onToggleLayout,
  onSetLayout,
  isOpen = true,
  onClose,
}) {
  const [formState, setFormState] = useState(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [draftBanner, setDraftBanner] = useState(false);
  const [draftEnabled, setDraftEnabled] = useState(true);

  useEffect(() => {
    const draft = loadDraft();
    if (hasMeaningfulDraft(draft)) {
      setDraftBanner(true);
    }
  }, []);

  useDraftNote({
    title: formState.title,
    content: formState.content,
    tags: formState.tags,
    groupId: formState.groupId,
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
    if (hasMeaningfulDraft(draft)) {
      setFormState({
        title: draft.title || "",
        content: draft.content || "",
        tags: draft.tags || "",
        groupId: draft.groupId || null,
      });
    }
    setDraftBanner(false);
  }

  function handleDiscardDraft() {
    clearDraft();
    setDraftEnabled(false);
    setFormState(initialFormState);
    setDraftBanner(false);
    setTimeout(() => setDraftEnabled(true), 0);
  }

  return (
    <section
      className={`panel composerPanel${layoutMode === "wide" ? " composerPanel--wide" : ""}`}
      inert={!isOpen ? "" : undefined}
    >
      <div className="sectionHeading">
        <h2>새 노트</h2>
        <div className="composerHeadingActions">
          {onSetLayout && isOpen ? (
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
          {isOpen && onClose ? (
            <button
              type="button"
              className="composerToggleButton"
              onClick={onClose}
              aria-label="접기"
            >
              ▴
            </button>
          ) : null}
        </div>
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

      <GroupSelect
        groups={groups}
        value={formState.groupId}
        onChange={(value) => updateField("groupId", value)}
        onCreateGroup={onCreateGroup}
        disabled={disabled}
      />

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
