export default function GroupFilterBar({ groups, activeGroupFilter, onChange }) {
  return (
    <div className="groupFilterBar" aria-label="그룹 필터">
      <button
        className={`groupFilterButton${activeGroupFilter === "all" ? " groupFilterButton--active" : ""}`}
        type="button"
        onClick={() => onChange("all")}
      >
        전체
      </button>
      <button
        className={`groupFilterButton${activeGroupFilter === "none" ? " groupFilterButton--active" : ""}`}
        type="button"
        onClick={() => onChange("none")}
      >
        그룹 없음
      </button>
      {groups.map((group) => (
        <button
          key={group.id}
          className={`groupFilterButton${activeGroupFilter === group.id ? " groupFilterButton--active" : ""}`}
          type="button"
          onClick={() => onChange(group.id)}
        >
          {group.name}
        </button>
      ))}
    </div>
  );
}
