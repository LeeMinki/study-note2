import { useEffect, useRef, useState } from "react";
import useKeyboardSave from "../hooks/useKeyboardSave";
import formatDisplayDate from "../utils/formatDisplayDate";
import previewText from "../utils/previewText";
import renderMarkdown from "../utils/renderMarkdown";
import { useAuthenticatedImages } from "../hooks/useAuthenticatedImages";

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
  const [editState, setEditState] = useState(() => createEditState(note));
  const [errorMessage, setErrorMessage] = useState("");
  const markdownRef = useRef(null);
  useAuthenticatedImages(markdownRef);

  useEffect(() => {
    setEditState(createEditState(note));
  }, [note]);

  async function handleSave() {
    if (!editState.title.trim()) {
      setErrorMessage("Title is required.");
      return;
    }

    setErrorMessage("");
    await onUpdate(note.id, editState);
    setIsEditing(false);
  }

  const handleKeyDown = useKeyboardSave(handleSave);

  function updateField(name, value) {
    setEditState((currentState) => ({
      ...currentState,
      [name]: value,
    }));
  }

  function handleCancel() {
    setEditState(createEditState(note));
    setErrorMessage("");
    setIsEditing(false);
  }

  return (
    <article className="panel noteCard">
      <header className="noteCardHeader">
        {isEditing ? (
          <input
            className="textInput"
            value={editState.title}
            onChange={(event) => updateField("title", event.target.value)}
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
              <button className="primaryButton" type="button" onClick={handleSave} disabled={isSaving}>
                Save
              </button>
              <button className="ghostButton" type="button" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="ghostButton" type="button" onClick={() => setIsEditing(true)}>
                Edit
              </button>
              <button className="dangerButton" type="button" onClick={() => onDelete(note.id)} disabled={isSaving}>
                Delete
              </button>
            </>
          )}
        </div>
      </header>

      <p className="notePreview">{previewText(note.content)}</p>

      {isEditing ? (
        <div className="editorStack">
          <textarea
            className="textArea"
            value={editState.content}
            onChange={(event) => updateField("content", event.target.value)}
            onKeyDown={handleKeyDown}
            rows={8}
            disabled={isSaving}
          />
          <input
            className="textInput"
            value={editState.tags}
            onChange={(event) => updateField("tags", event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
          />
          {errorMessage ? <p className="errorText">{errorMessage}</p> : null}
        </div>
      ) : (
        <div
          ref={markdownRef}
          className="markdownBody"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
        />
      )}

      <div className="tagList">
        {note.tags.map((tag) => (
          <button
            key={tag}
            className={`tag ${activeTag === tag ? "tagActive" : ""}`}
            type="button"
            onClick={() => onTagSelect(tag)}
          >
            #{tag}
          </button>
        ))}
      </div>
    </article>
  );
}
