import { useRef, useState } from "react";
import { renderContent } from "../utils/contentUtils";
import { useAuthenticatedImages } from "../hooks/useAuthenticatedImages";

function GroupNotePreview({ content }) {
  const ref = useRef(null);
  useAuthenticatedImages(ref);
  return (
    <div
      ref={ref}
      className="groupNotePreview"
      dangerouslySetInnerHTML={{ __html: renderContent(content) || "<p>본문 내용이 없습니다.</p>" }}
    />
  );
}

export default function GroupManager({
  groups,
  notes = [],
  disabled,
  onCreate,
  onRename,
  onDelete,
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [expandedGroupId, setExpandedGroupId] = useState("");
  const [expandedNoteId, setExpandedNoteId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCreate() {
    if (!newGroupName.trim()) {
      setErrorMessage("그룹 이름을 입력하세요.");
      return;
    }

    try {
      setErrorMessage("");
      await onCreate({ name: newGroupName });
      setNewGroupName("");
    } catch (error) {
      setErrorMessage(error.message);
    }
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

    try {
      setErrorMessage("");
      await onRename(groupId, { name: editingName });
      setEditingGroupId("");
      setEditingName("");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleDelete(group) {
    const confirmed = window.confirm(`'${group.name}' 그룹을 삭제할까요? 노트는 삭제되지 않고 그룹 없음으로 이동합니다.`);
    if (!confirmed) {
      return;
    }

    try {
      await onDelete(group.id);
      if (expandedGroupId === group.id) {
        setExpandedGroupId("");
        setExpandedNoteId("");
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function getNotesForGroup(groupId) {
    return notes.filter((note) => note.groupId === groupId);
  }

  function toggleGroup(groupId) {
    setExpandedGroupId((currentGroupId) => (currentGroupId === groupId ? "" : groupId));
    setExpandedNoteId("");
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
              <div className="groupListHeader">
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
                    <button
                      className="groupNameButton"
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      aria-expanded={expandedGroupId === group.id}
                    >
                      <span>{expandedGroupId === group.id ? "▾" : "▸"}</span>
                      <span>{group.name}</span>
                      <span className="groupNoteCount">{getNotesForGroup(group.id).length}개 노트</span>
                    </button>
                    <button className="ghostButton" type="button" onClick={() => startEditing(group)} disabled={disabled}>
                      이름 변경
                    </button>
                    <button className="dangerButton" type="button" onClick={() => handleDelete(group)} disabled={disabled}>
                      삭제
                    </button>
                  </>
                )}
              </div>

              {expandedGroupId === group.id ? (
                <div className="groupNotesPanel">
                  {getNotesForGroup(group.id).length === 0 ? (
                    <p className="groupEmptyText">이 그룹에 속한 노트가 없습니다.</p>
                  ) : (
                    <ul className="groupNoteList">
                      {getNotesForGroup(group.id).map((note) => (
                        <li key={note.id} className="groupNoteItem">
                          <button
                            className="groupNoteButton"
                            type="button"
                            onClick={() => setExpandedNoteId((currentNoteId) => (currentNoteId === note.id ? "" : note.id))}
                            aria-expanded={expandedNoteId === note.id}
                          >
                            {note.title}
                          </button>
                          {expandedNoteId === note.id ? (
                            <GroupNotePreview content={note.content} />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
