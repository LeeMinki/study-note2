import { useState } from "react";
import useKeyboardSave from "../hooks/useKeyboardSave";

const initialFormState = {
  title: "",
  content: "",
  tags: "",
};

export default function NoteComposer({ onCreate, disabled }) {
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
    <section className="panel composerPanel">
      <div className="sectionHeading">
        <h2>Quick Note</h2>
        <p>Write fast. Save with Ctrl/Cmd + Enter.</p>
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
