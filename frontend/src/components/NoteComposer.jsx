import { useState } from "react";
import useKeyboardSave from "../hooks/useKeyboardSave";

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

export default function NoteComposer({ onCreate, disabled, layoutMode = "default", onToggleLayout, onSetLayout }) {
  const [formState, setFormState] = useState(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit() {
    if (!formState.title.trim()) {
      setErrorMessage("Title is required.");
      return;
    }

    setErrorMessage("");
    await onCreate(formState);
    setFormState(initialFormState);
  }

  const handleKeyDown = useKeyboardSave(handleSubmit);

  function updateField(name, value) {
    setFormState((currentState) => ({
      ...currentState,
      [name]: value,
    }));
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
