import { useEffect, useRef, useState } from "react";
import useKeyboardSave from "../hooks/useKeyboardSave";
import formatDisplayDate from "../utils/formatDisplayDate";
import previewText from "../utils/previewText";
import { renderContent } from "../utils/contentUtils";
import { useAuthenticatedImages } from "../hooks/useAuthenticatedImages";
import NoteFullscreen from "./NoteFullscreen";
import RichEditor from "./RichEditor";

function createEditState(note) {
  return {
    title: note.title,
    content: note.content,
    tags: note.tags.join(", "),
  };
}

export default function NoteCard({
  note,
  isSaving,
  onUpdate,
  onDelete,
  onTagSelect,
  activeTag,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editState, setEditState] = useState(() => createEditState(note));
  const [errorMessage, setErrorMessage] = useState("");
  const markdownRef = useRef(null);
  useAuthenticatedImages(markdownRef);

  useEffect(() => {
    setEditState(createEditState(note));
  }, [note]);

  async function handleSave() {
    if (!editState.title.trim()) {
      setErrorMessage("제목은 필수입니다.");
      return;
    }
    setErrorMessage("");
    await onUpdate(note.id, editState);
    setIsEditing(false);
  }

  const handleKeyDown = useKeyboardSave(handleSave);

  function updateField(name, value) {
    setEditState((s) => ({ ...s, [name]: value }));
  }

  function handleCancel() {
    setEditState(createEditState(note));
    setErrorMessage("");
    setIsEditing(false);
  }

  return (
    <>
      {isFullscreen && (
        <NoteFullscreen note={note} onClose={() => setIsFullscreen(false)} />
      )}

      <article className="panel noteCard">
        <header className="noteCardHeader">
          {isEditing ? (
            <input
              className="textInput"
              value={editState.title}
              onChange={(e) => updateField("title", e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
            />
          ) : (
            <div>
              <h3>{note.title}</h3>
              <p className="noteMeta">{formatDisplayDate(note.createdAt)}</p>
            </div>
          )}
          <div className="cardActions">
            {isEditing ? (
              <>
                <button
                  className="primaryButton"
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  저장
                </button>
                <button
                  className="ghostButton"
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <button
                  className="ghostButton"
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                >
                  전체화면
                </button>
                <button
                  className="ghostButton"
                  type="button"
                  onClick={() => setIsEditing(true)}
                >
                  편집
                </button>
                <button
                  className="dangerButton"
                  type="button"
                  onClick={() => onDelete(note.id)}
                  disabled={isSaving}
                >
                  삭제
                </button>
              </>
            )}
          </div>
        </header>

        <p className="notePreview">{previewText(note.content)}</p>

        {isEditing ? (
          <div className="editorStack">
            <RichEditor
              value={editState.content}
              onChange={(html) => updateField("content", html)}
              disabled={isSaving}
              placeholder="내용을 입력하세요"
            />
            <input
              className="textInput"
              value={editState.tags}
              onChange={(e) => updateField("tags", e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              placeholder="태그 (쉼표로 구분)"
            />
            {errorMessage ? <p className="errorText">{errorMessage}</p> : null}
          </div>
        ) : (
          <div
            ref={markdownRef}
            className="markdownBody"
            dangerouslySetInnerHTML={{ __html: renderContent(note.content) }}
          />
        )}

        <div className="tagList">
          {note.tags.map((tag) => (
            <button
              key={tag}
              className={`tag${activeTag === tag ? " tagActive" : ""}`}
              type="button"
              onClick={() => onTagSelect(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </article>
    </>
  );
}
