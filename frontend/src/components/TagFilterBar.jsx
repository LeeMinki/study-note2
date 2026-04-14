export default function TagFilterBar({ activeTag, onClear }) {
  if (!activeTag) {
    return null;
  }

  return (
    <div className="tagFilterBar">
      <span className="tagFilterLabel">Filtered by</span>
      <button className="tag tagActive" type="button" onClick={onClear}>
        #{activeTag} ×
      </button>
    </div>
  );
}
