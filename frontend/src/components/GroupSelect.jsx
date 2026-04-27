export default function GroupSelect({
  groups,
  value,
  onChange,
  disabled = false,
  label = "그룹",
}) {
  return (
    <label className="groupSelectLabel">
      <span>{label}</span>
      <select
        className="groupSelect"
        value={value || ""}
        onChange={(event) => onChange(event.target.value || null)}
        disabled={disabled}
      >
        <option value="">그룹 없음</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </label>
  );
}
