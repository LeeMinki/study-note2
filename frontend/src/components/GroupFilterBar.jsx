export default function GroupFilterBar({ groups, activeGroupFilter, onChange }) {
  return (
    <div className="groupFilterBar" aria-label="그룹 필터">
      <label className="groupFilterLabel" htmlFor="group-filter">그룹</label>
      <select
        id="group-filter"
        className="groupFilterSelect"
        value={activeGroupFilter}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="all">전체</option>
        <option value="none">그룹 없음</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </div>
  );
}
