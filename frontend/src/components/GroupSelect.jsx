import { useState } from "react";

export default function GroupSelect({
  groups,
  value,
  onChange,
  onCreateGroup,
  disabled = false,
  label = "그룹",
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCreateGroup() {
    if (!newGroupName.trim()) {
      setErrorMessage("그룹 이름을 입력하세요.");
      return;
    }

    if (!onCreateGroup) {
      return;
    }

    try {
      setErrorMessage("");
      const group = await onCreateGroup({ name: newGroupName });
      if (group?.id) {
        onChange(group.id);
      }
      setNewGroupName("");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <div className="groupSelectBlock">
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

      {onCreateGroup ? (
        <div className="groupSelectCreateRow">
          <input
            className="textInput"
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
            placeholder="새 그룹 이름"
            disabled={disabled}
          />
          <button
            className="ghostButton"
            type="button"
            onClick={handleCreateGroup}
            disabled={disabled}
          >
            그룹 추가
          </button>
        </div>
      ) : null}

      {errorMessage ? <p className="errorText">{errorMessage}</p> : null}
    </div>
  );
}
