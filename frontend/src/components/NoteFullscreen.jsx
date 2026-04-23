import { useEffect, useRef } from "react";
import { useAuthenticatedImages } from "../hooks/useAuthenticatedImages";
import { renderContent } from "../utils/contentUtils";
import formatDisplayDate from "../utils/formatDisplayDate";

export default function NoteFullscreen({ note, onClose }) {
  const contentRef = useRef(null);
  useAuthenticatedImages(contentRef);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fullscreenOverlay" onClick={onClose}>
      <div className="fullscreenPanel" onClick={(e) => e.stopPropagation()}>
        <header className="fullscreenHeader">
          <div>
            <h2 className="fullscreenTitle">{note.title}</h2>
            <p className="noteMeta">{formatDisplayDate(note.createdAt)}</p>
          </div>
          <button
            type="button"
            className="fullscreenClose"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        {note.tags.length > 0 && (
          <div className="tagList">
            {note.tags.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div
          ref={contentRef}
          className="markdownBody fullscreenBody"
          dangerouslySetInnerHTML={{ __html: renderContent(note.content) }}
        />
      </div>
    </div>
  );
}
