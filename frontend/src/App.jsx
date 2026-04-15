import { useEffect, useState } from "react";
import NoteComposer from "./components/NoteComposer";
import NoteList from "./components/NoteList";
import SearchBar from "./components/SearchBar";
import TagFilterBar from "./components/TagFilterBar";
import AuthForm from "./components/AuthForm";
import ProfileView from "./components/ProfileView";
import {
  createNote,
  deleteNote,
  fetchNotes,
  updateNote,
} from "./services/notesApi";
import useLayoutPreference from "./hooks/useLayoutPreference";
import useAuth from "./hooks/useAuth";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [hasAnyNotes, setHasAnyNotes] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentView, setCurrentView] = useState("notes");
  const { layoutMode, setLayout, toggleLayout } = useLayoutPreference();
  const {
    isAuthenticated,
    currentUser,
    authError,
    isAuthLoading,
    isProfileSaving,
    login,
    register,
    logout,
    updateProfile,
  } = useAuth();

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

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentView("notes");
    }
  }, [isAuthenticated]);

  // 인증 전: 로그인/회원가입 화면 표시
  if (!isAuthenticated) {
    return (
      <AuthForm
        onLogin={login}
        onRegister={register}
        errorMessage={authError}
        isLoading={isAuthLoading}
      />
    );
  }

  if (currentView === "profile") {
    return (
      <ProfileView
        currentUser={currentUser}
        isLoading={isAuthLoading}
        isSaving={isProfileSaving}
        errorMessage={authError}
        onBack={() => setCurrentView("notes")}
        onLogout={logout}
        onSave={updateProfile}
      />
    );
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
          <div className="heroActionRow">
            <button className="ghostButton" type="button" onClick={() => setCurrentView("profile")}>
              {currentUser?.displayName ? `${currentUser.displayName} 프로필` : "프로필"}
            </button>
            <button className="ghostButton" type="button" onClick={logout}>
              로그아웃
            </button>
          </div>
        </div>
      </section>

      {errorMessage ? <p className="errorBanner">{errorMessage}</p> : null}

      <div className={`contentGrid${layoutMode === "wide" ? " contentGrid--wide" : ""}${layoutMode === "narrow" ? " contentGrid--narrow" : ""}`}>
        <NoteComposer
          onCreate={handleCreate}
          disabled={isSaving}
          layoutMode={layoutMode}
          onToggleLayout={toggleLayout}
          onSetLayout={setLayout}
        />
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
