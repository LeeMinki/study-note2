import NoteCard from "./NoteCard";

export default function NoteList({
  notes,
  hasAnyNotes,
  isLoading,
  isSaving,
  activeTag,
  onUpdate,
  onDelete,
  onTagSelect,
  onClearFilters,
}) {
  if (isLoading) {
    return <section className="panel emptyState">Loading notes...</section>;
  }

  if (!hasAnyNotes) {
    return (
      <section className="panel emptyState">
        <h3>No notes yet</h3>
        <p>Create your first study note to get started.</p>
      </section>
    );
  }

  if (notes.length === 0) {
    return (
      <section className="panel emptyState">
        <h3>No matching notes</h3>
        <p>Try clearing the current search or tag filter.</p>
        <button className="ghostButton" type="button" onClick={onClearFilters}>
          Clear filters
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
          onUpdate={onUpdate}
          onDelete={onDelete}
          onTagSelect={onTagSelect}
        />
      ))}
    </section>
  );
}
