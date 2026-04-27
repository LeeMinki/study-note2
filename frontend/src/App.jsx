import { useEffect, useState } from "react";
import NoteComposer from "./components/NoteComposer";
import NoteList from "./components/NoteList";
import SearchBar from "./components/SearchBar";
import TagFilterBar from "./components/TagFilterBar";
import GroupFilterBar from "./components/GroupFilterBar";
import GroupManager from "./components/GroupManager";
import AuthForm from "./components/AuthForm";
import ProfileView from "./components/ProfileView";
import {
  createNote,
  deleteNote,
  fetchNotes,
  updateNote,
} from "./services/notesApi";
import {
  createGroup,
  deleteGroup,
  fetchGroups,
  updateGroup,
} from "./services/groupsApi";
import useLayoutPreference from "./hooks/useLayoutPreference";
import useAuth from "./hooks/useAuth";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [hasAnyNotes, setHasAnyNotes] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [activeGroupFilter, setActiveGroupFilter] = useState("all");
  const [groups, setGroups] = useState([]);
  const [groupNotes, setGroupNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentView, setCurrentView] = useState("notes");
  const [ssoError, setSsoError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState(false);
  const { layoutMode, setLayout, toggleLayout } = useLayoutPreference();
  const {
    isAuthenticated,
    currentUser,
    authError,
    isAuthLoading,
    isProfileSaving,
    isPasswordSaving,
    login,
    loginWithToken,
    refreshUser,
    linkGoogle,
    register,
    logout,
    updateProfile,
    updatePassword,
  } = useAuth();

  // SSO 로그인 후 URL hash/query 처리 (마운트 1회)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("sso-token=")) {
      const token = new URLSearchParams(hash.slice(1)).get("sso-token");
      if (token) {
        loginWithToken(token);
        history.replaceState(null, "", window.location.pathname + window.location.search);
        return;
      }
    }

    const searchParams = new URLSearchParams(window.location.search);

    // 계정 연결 성공
    if (searchParams.get("link_success") === "true") {
      searchParams.delete("link_success");
      history.replaceState(null, "", window.location.pathname + (searchParams.toString() ? `?${searchParams}` : ""));
      setCurrentView("profile");
      setLinkSuccess(true);
      refreshUser();
      return;
    }

    // 계정 연결 실패
    const linkError = searchParams.get("link_error");
    if (linkError) {
      const linkErrorMessages = {
        already_linked: "이 Google 계정은 이미 다른 계정에 연결되어 있습니다.",
        server_error: "연결 중 오류가 발생했습니다. 다시 시도해주세요.",
        email_not_verified: "Google 이메일이 인증되지 않아 연결할 수 없습니다.",
      };
      setSsoError(linkErrorMessages[linkError] || "Google 계정 연결에 실패했습니다.");
      searchParams.delete("link_error");
      history.replaceState(null, "", window.location.pathname + (searchParams.toString() ? `?${searchParams}` : ""));
      setCurrentView("profile");
      return;
    }

    // SSO 로그인 오류
    const errorCode = searchParams.get("sso_error");
    if (errorCode) {
      const messages = {
        provider_error: "Google 로그인이 취소되었거나 오류가 발생했습니다.",
        state_mismatch: "보안 검증에 실패했습니다. 다시 시도해주세요.",
        email_not_verified: "Google 이메일이 인증되지 않아 로그인할 수 없습니다.",
        server_error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      };
      setSsoError(messages[errorCode] || "SSO 로그인에 실패했습니다.");
      searchParams.delete("sso_error");
      history.replaceState(null, "", window.location.pathname + (searchParams.toString() ? `?${searchParams}` : ""));
    }
  }, [loginWithToken, refreshUser]);

  async function loadNotes(nextFilters = { searchText, activeTag, activeGroupFilter }) {
    setIsLoading(true);

    try {
      const nextNotes = await fetchNotes(nextFilters);
      setNotes(nextNotes);
      const isFilteredView = Boolean(
        nextFilters.searchText?.trim() ||
          nextFilters.activeTag?.trim() ||
          (nextFilters.activeGroupFilter && nextFilters.activeGroupFilter !== "all"),
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

  async function loadGroups() {
    try {
      const nextGroups = await fetchGroups();
      setGroups(nextGroups);
      setErrorMessage("");
      return nextGroups;
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function loadGroupNotes() {
    const nextNotes = await fetchNotes({ searchText: "", activeTag: "", activeGroupFilter: "all" });
    setGroupNotes(nextNotes);
    return nextNotes;
  }

  // 로그아웃 시 이전 계정 노트를 즉시 초기화한다
  useEffect(() => {
    if (!isAuthenticated) {
      setNotes([]);
      setGroups([]);
      setGroupNotes([]);
      setHasAnyNotes(false);
      setActiveGroupFilter("all");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadNotes();
  }, [searchText, activeTag, activeGroupFilter, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadGroups();
  }, [isAuthenticated]);

  async function handleCreate(noteInput) {
    setIsSaving(true);

    try {
      await createNote(noteInput);
      await loadNotes({ searchText, activeTag, activeGroupFilter });
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
      await loadNotes({ searchText, activeTag, activeGroupFilter });
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
      await loadNotes({ searchText, activeTag, activeGroupFilter });
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
    setActiveGroupFilter("all");
  }

  async function handleCreateGroup(groupInput) {
    setIsSaving(true);

    try {
      const createdGroup = await createGroup(groupInput);
      await loadGroups();
      setErrorMessage("");
      return createdGroup;
    } catch (error) {
      setErrorMessage(error.message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRenameGroup(groupId, groupInput) {
    setIsSaving(true);

    try {
      await updateGroup(groupId, groupInput);
      await loadGroups();
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteGroup(groupId) {
    setIsSaving(true);

    try {
      await deleteGroup(groupId);
      await loadGroups();
      const nextGroupFilter = activeGroupFilter === groupId ? "none" : activeGroupFilter;
      setActiveGroupFilter(nextGroupFilter);
      await loadNotes({ searchText, activeTag, activeGroupFilter: nextGroupFilter });
      await loadGroupNotes();
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOpenGroups() {
    setIsLoading(true);

    try {
      await loadGroups();
      await loadGroupNotes();
      setCurrentView("groups");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
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
        errorMessage={authError || ssoError}
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
        isPasswordSaving={isPasswordSaving}
        errorMessage={authError || ssoError}
        linkSuccess={linkSuccess}
        onLinkGoogle={linkGoogle}
        onBack={() => { setCurrentView("notes"); setLinkSuccess(false); setSsoError(""); }}
        onLogout={logout}
        onSave={updateProfile}
        onPasswordSave={updatePassword}
      />
    );
  }

  if (currentView === "groups") {
    return (
      <main className="appShell">
        <section className="profileHero">
          <div>
            <button className="eyebrowButton" type="button" onClick={() => setCurrentView("notes")}>Study Note</button>
            <h1>그룹 관리</h1>
            <p className="heroText">노트를 묶는 상위 분류를 만들고 정리하세요.</p>
          </div>
          <div className="profileHeroActions">
            <button className="ghostButton" type="button" onClick={() => setCurrentView("notes")}>
              노트로 돌아가기
            </button>
          </div>
        </section>

        {errorMessage ? <p className="errorBanner">{errorMessage}</p> : null}

        <GroupManager
          groups={groups}
          notes={groupNotes}
          disabled={isSaving}
          onCreate={handleCreateGroup}
          onRename={handleRenameGroup}
          onDelete={handleDeleteGroup}
        />
      </main>
    );
  }

  return (
    <main className="appShell">
      <section className="hero">
        <div>
          <button className="eyebrowButton" type="button" onClick={handleClearFilters}>Study Note</button>
          <h1>안녕하세요, {currentUser?.displayName || currentUser?.name}님</h1>
          <p className="heroText">노트를 작성하고 검색하세요.</p>
        </div>
        <div className="heroControls">
          <SearchBar value={searchText} onChange={setSearchText} />
          <TagFilterBar activeTag={activeTag} onClear={handleClearFilters} />
          <GroupFilterBar
            groups={groups}
            activeGroupFilter={activeGroupFilter}
            onChange={setActiveGroupFilter}
          />
          <div className="heroActionRow">
            <button className="ghostButton" type="button" onClick={handleOpenGroups}>
              그룹 관리
            </button>
            <button className="ghostButton" type="button" onClick={() => setCurrentView("profile")}>
              프로필
            </button>
            <button className="dangerButton" type="button" onClick={logout}>
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
          groups={groups}
          onCreateGroup={handleCreateGroup}
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
          groups={groups}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onTagSelect={handleTagSelect}
          onClearFilters={handleClearFilters}
        />
      </div>
    </main>
  );
}
