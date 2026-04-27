import { useEffect, useRef } from "react";

const STORAGE_KEY = "study-note-draft";
const DEBOUNCE_MS = 3000;

function stripHtml(value) {
  return String(value || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function hasMeaningfulDraft(draft) {
  if (!draft || typeof draft !== "object") {
    return false;
  }

  return Boolean(
    String(draft.title || "").trim() ||
      stripHtml(draft.content) ||
      String(draft.tags || "").trim()
  );
}

// localStorage에서 임시저장 데이터를 읽어 반환한다. 없으면 null 반환.
export function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const draft = JSON.parse(raw);
    if (!hasMeaningfulDraft(draft)) {
      clearDraft();
      return null;
    }

    return draft;
  } catch {
    clearDraft();
    return null;
  }
}

// 임시저장 데이터를 삭제한다.
export function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
}

// title/content/tags 변경 후 3초 debounce로 localStorage에 임시저장한다.
// enabled가 false이면 저장하지 않는다 (노트 저장 완료 후 빈 폼 상태에서 불필요한 저장 방지).
export default function useDraftNote({ title, content, tags, groupId, enabled }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const draft = {
      title,
      content,
      tags,
      groupId: groupId || null,
      savedAt: new Date().toISOString(),
    };

    // 빈 폼이면 이전 임시저장도 제거해 잘못된 복원 배너를 막는다
    if (!hasMeaningfulDraft(draft)) {
      clearDraft();
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [title, content, tags, groupId, enabled]);
}
