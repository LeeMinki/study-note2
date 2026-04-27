import NoteCard from "./NoteCard";

export default function NoteList({
  notes,
  hasAnyNotes,
  isLoading,
  isSaving,
  activeTag,
  groups,
  onUpdate,
  onDelete,
  onTagSelect,
  onClearFilters,
}) {
  if (isLoading) {
    return (
      <section className="panel loadingState">
        <span className="spinner" aria-hidden="true" />
        노트 불러오는 중…
      </section>
    );
  }

  if (!hasAnyNotes) {
    return (
      <section className="panel emptyState">
        <h3>아직 노트가 없습니다</h3>
        <p>첫 번째 노트를 작성해보세요.</p>
      </section>
    );
  }

  if (notes.length === 0) {
    return (
      <section className="panel emptyState">
        <h3>일치하는 노트가 없습니다</h3>
        <p>검색어, 태그, 그룹 필터를 초기화해보세요.</p>
        <button className="ghostButton" type="button" onClick={onClearFilters}>
          필터 초기화
        </button>
      </section>
    );
  }

  return (
    <section className="noteList">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          isSaving={isSaving}
          activeTag={activeTag}
          groups={groups}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onTagSelect={onTagSelect}
        />
      ))}
    </section>
  );
}
