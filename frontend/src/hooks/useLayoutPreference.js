import { useState } from "react";

// localStorage 키 상수
const STORAGE_KEY = "study-note-layout";

// 지원하는 레이아웃 모드
const LAYOUT_MODES = ["narrow", "default", "wide"];

// 저장된 값이 유효한 모드인지 검증
function resolveInitialMode() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return LAYOUT_MODES.includes(saved) ? saved : "default";
}

// 레이아웃 선호 상태를 localStorage와 동기화하는 훅
export default function useLayoutPreference() {
  const [layoutMode, setLayoutModeState] = useState(resolveInitialMode);

  // 모드를 설정하고 localStorage에 저장
  function setLayout(mode) {
    if (!LAYOUT_MODES.includes(mode)) return;
    setLayoutModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }

  // default ↔ wide 단순 토글 (US1/US2용)
  function toggleLayout() {
    setLayout(layoutMode === "wide" ? "default" : "wide");
  }

  return { layoutMode, setLayout, toggleLayout };
}
