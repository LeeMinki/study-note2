export function shouldTriggerKeyboardSave(event) {
  return event.key === "Enter" && (event.metaKey || event.ctrlKey);
}

export default function useKeyboardSave(onSave) {
  function handleKeyDown(event) {
    if (!shouldTriggerKeyboardSave(event)) {
      return;
    }

    event.preventDefault();
    onSave();
  }

  return handleKeyDown;
}
