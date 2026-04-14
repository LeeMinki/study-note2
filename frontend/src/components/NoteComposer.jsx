import { useState, useEffect } from "react";
import useKeyboardSave from "../hooks/useKeyboardSave";
import useDraftNote, { loadDraft, clearDraft } from "../hooks/useDraftNote";
import { uploadImage } from "../services/imagesApi";

const initialFormState = {
  title: "",
  content: "",
  tags: "",
};

// 레이아웃 모드별 레이블 및 다음 모드 정의
const LAYOUT_LABELS = {
  narrow: "좁게",
  default: "기본",
  wide: "넓게",
};

// 임시저장 placeholder 텍스트
const UPLOAD_PLACEHOLDER = "![업로드 중...]";

export default function NoteComposer({ onCreate, disabled, layoutMode = "default", onToggleLayout, onSetLayout }) {
  const [formState, setFormState] = useState(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [draftBanner, setDraftBanner] = useState(false);
  const [draftEnabled, setDraftEnabled] = useState(true);

  // 마운트 시 임시저장 데이터 확인
  useEffect(() => {
    const draft = loadDraft();
    if (draft && (draft.title || draft.content || draft.tags)) {
      setDraftBanner(true);
    }
  }, []);

  // 3초 debounce 자동저장 (노트 저장 완료 후에는 비활성화)
  useDraftNote({
    title: formState.title,
    content: formState.content,
    tags: formState.tags,
    enabled: draftEnabled,
  });

  async function handleSubmit() {
    if (!formState.title.trim()) {
      setErrorMessage("Title is required.");
      return;
    }

    setErrorMessage("");
    await onCreate(formState);

    // 저장 성공 시 임시저장 삭제 및 폼 초기화
    clearDraft();
    setDraftEnabled(false);
    setFormState(initialFormState);
    setDraftBanner(false);
    // 다음 입력부터 다시 저장 활성화
    setTimeout(() => setDraftEnabled(true), 0);
  }

  const handleKeyDown = useKeyboardSave(handleSubmit);

  function updateField(name, value) {
    setFormState((currentState) => ({
      ...currentState,
      [name]: value,
    }));
  }

  // 임시저장 복원 배너: "복원" 클릭 시 폼 채우기
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

  // 임시저장 삭제 배너: "삭제" 클릭 시 draft 제거
  function handleDiscardDraft() {
    clearDraft();
    setDraftBanner(false);
  }

  // content textarea paste 이벤트 핸들러
  async function handleContentPaste(event) {
    const items = event.clipboardData?.items;
    if (!items) return;

    // 이미지 항목 탐색
    let imageFile = null;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        imageFile = item.getAsFile();
        break;
      }
    }

    if (!imageFile) return;

    // 이미지 감지 시 기본 붙여넣기 동작 차단
    event.preventDefault();

    const textarea = event.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formState.content;

    // 커서 위치에 임시 텍스트 삽입
    const newContent =
      currentContent.slice(0, start) +
      UPLOAD_PLACEHOLDER +
      currentContent.slice(end);

    updateField("content", newContent);

    try {
      const result = await uploadImage(imageFile);

      if (result.success) {
        const markdownImage = `![image](${result.data.url})`;
        // 임시 텍스트를 실제 마크다운으로 교체
        setFormState((prev) => ({
          ...prev,
          content: prev.content.replace(UPLOAD_PLACEHOLDER, markdownImage),
        }));
      } else {
        // 업로드 실패 시 임시 텍스트 제거
        setFormState((prev) => ({
          ...prev,
          content: prev.content.replace(UPLOAD_PLACEHOLDER, ""),
        }));
        setErrorMessage(result.error || "이미지 업로드에 실패했습니다.");
      }
    } catch {
      // 네트워크 오류 등 예외 처리
      setFormState((prev) => ({
        ...prev,
        content: prev.content.replace(UPLOAD_PLACEHOLDER, ""),
      }));
      setErrorMessage("이미지 업로드 중 오류가 발생했습니다.");
    }
  }

  return (
    <section className={`panel composerPanel${layoutMode === "wide" ? " composerPanel--wide" : ""}`}>
      <div className="sectionHeading">
        <div>
          <h2>Quick Note</h2>
          <p>Write fast. Save with Ctrl/Cmd + Enter.</p>
        </div>
        {/* 레이아웃 선택 버튼 그룹 (US3: 3단계) */}
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

      {/* 임시저장 복원 배너 */}
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
        onChange={(event) => updateField("title", event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Title"
        disabled={disabled}
      />
      <textarea
        className="textArea"
        value={formState.content}
        onChange={(event) => updateField("content", event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handleContentPaste}
        placeholder="Markdown content"
        rows={8}
        disabled={disabled}
      />
      <input
        className="textInput"
        value={formState.tags}
        onChange={(event) => updateField("tags", event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tags separated by commas"
        disabled={disabled}
      />
      {errorMessage ? <p className="errorText">{errorMessage}</p> : null}
      <div className="composerActions">
        <button className="primaryButton" type="button" onClick={handleSubmit} disabled={disabled}>
          Save Note
        </button>
      </div>
    </section>
  );
}
