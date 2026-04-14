import { useEffect, useState } from "react";
import NoteComposer from "./components/NoteComposer";
import NoteList from "./components/NoteList";
import SearchBar from "./components/SearchBar";
import TagFilterBar from "./components/TagFilterBar";
import {
  createNote,
  deleteNote,
  fetchNotes,
  updateNote,
} from "./services/notesApi";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [hasAnyNotes, setHasAnyNotes] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadNotes(nextFilters = { searchText, activeTag }) {
    setIsLoading(true);

    try {
      const nextNotes = await fetchNotes(nextFilters);
      setNotes(nextNotes);
      const isFilteredView = Boolean(
        nextFilters.searchText?.trim() || nextFilters.activeTag?.trim(),
      );

      setHasAnyNotes((currentValue) => {
        if (isFilteredView) {
          return currentValue || nextNotes.length > 0;
        }

        return nextNotes.length > 0;
      });
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, [searchText, activeTag]);

  async function handleCreate(noteInput) {
    setIsSaving(true);

    try {
      await createNote(noteInput);
      await loadNotes({ searchText, activeTag });
      setHasAnyNotes(true);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(noteId, noteInput) {
    setIsSaving(true);

    try {
      await updateNote(noteId, noteInput);
      await loadNotes({ searchText, activeTag });
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(noteId) {
    setIsSaving(true);

    try {
      await deleteNote(noteId);
      await loadNotes({ searchText, activeTag });
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleTagSelect(tag) {
    setActiveTag((currentTag) => (currentTag === tag ? "" : tag));
  }

  function handleClearFilters() {
    setSearchText("");
    setActiveTag("");
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
        <div className="heroControls">
          <SearchBar value={searchText} onChange={setSearchText} />
          <TagFilterBar activeTag={activeTag} onClear={handleClearFilters} />
        </div>
      </section>

      {errorMessage ? <p className="errorBanner">{errorMessage}</p> : null}

      <div className="contentGrid">
        <NoteComposer onCreate={handleCreate} disabled={isSaving} />
        <NoteList
          notes={notes}
          hasAnyNotes={hasAnyNotes}
          isLoading={isLoading}
          isSaving={isSaving}
          activeTag={activeTag}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onTagSelect={handleTagSelect}
          onClearFilters={handleClearFilters}
        />
      </div>
    </main>
  );
}
