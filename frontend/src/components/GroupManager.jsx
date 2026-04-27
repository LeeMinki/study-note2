import { useState } from "react";

export default function GroupManager({
  groups,
  disabled,
  onCreate,
  onRename,
  onDelete,
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCreate() {
    if (!newGroupName.trim()) {
      setErrorMessage("그룹 이름을 입력하세요.");
      return;
    }

    setErrorMessage("");
    await onCreate({ name: newGroupName });
    setNewGroupName("");
  }

  function startEditing(group) {
    setEditingGroupId(group.id);
    setEditingName(group.name);
    setErrorMessage("");
  }

  async function handleRename(groupId) {
    if (!editingName.trim()) {
      setErrorMessage("그룹 이름을 입력하세요.");
      return;
    }

    setErrorMessage("");
    await onRename(groupId, { name: editingName });
    setEditingGroupId("");
    setEditingName("");
  }

  async function handleDelete(group) {
    const confirmed = window.confirm(`'${group.name}' 그룹을 삭제할까요? 노트는 삭제되지 않고 그룹 없음으로 이동합니다.`);
    if (!confirmed) {
      return;
    }

    await onDelete(group.id);
  }

  return (
    <section className="panel groupManager">
      <div className="sectionHeading">
        <div>
          <h2>그룹 관리</h2>
          <p>태그와 별개로 노트를 묶어 정리합니다.</p>
        </div>
      </div>

      <div className="groupCreateRow">
        <input
          className="textInput"
          value={newGroupName}
          onChange={(event) => setNewGroupName(event.target.value)}
          placeholder="새 그룹 이름"
          disabled={disabled}
        />
        <button className="primaryButton" type="button" onClick={handleCreate} disabled={disabled}>
          추가
        </button>
      </div>

      {errorMessage ? <p className="errorText">{errorMessage}</p> : null}

      {groups.length === 0 ? (
        <p className="groupEmptyText">아직 그룹이 없습니다.</p>
      ) : (
        <ul className="groupList">
          {groups.map((group) => (
            <li key={group.id} className="groupListItem">
              {editingGroupId === group.id ? (
                <>
                  <input
                    className="textInput"
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    disabled={disabled}
                  />
                  <button className="primaryButton" type="button" onClick={() => handleRename(group.id)} disabled={disabled}>
                    저장
                  </button>
                  <button className="ghostButton" type="button" onClick={() => setEditingGroupId("")} disabled={disabled}>
                    취소
                  </button>
                </>
              ) : (
                <>
                  <span className="groupName">{group.name}</span>
                  <button className="ghostButton" type="button" onClick={() => startEditing(group)} disabled={disabled}>
                    이름 변경
                  </button>
                  <button className="dangerButton" type="button" onClick={() => handleDelete(group)} disabled={disabled}>
                    삭제
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
