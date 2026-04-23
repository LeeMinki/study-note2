import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { FontFamily } from "@tiptap/extension-font-family";
import { uploadImage } from "../services/imagesApi";
import { isRichContent, renderContent } from "../utils/contentUtils";
import { useAuthenticatedImages } from "../hooks/useAuthenticatedImages";
import renderMarkdown from "../utils/renderMarkdown";

function stripTags(html) {
  return html.replace(/<[^>]+>/g, "");
}

// TipTap HTML → 마크다운 (모드 전환 시 베스트에포트 변환)
function htmlToMarkdown(html) {
  if (!html || !isRichContent(html)) return html || "";
  return html
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "```\n$1\n```\n\n")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `# ${stripTags(t)}\n\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `## ${stripTags(t)}\n\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `### ${stripTags(t)}\n\n`)
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*")
    .replace(/<s[^>]*>([\s\S]*?)<\/s>/gi, "~~$1~~")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"/gi, "![$2]($1)")
    .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"/gi, "![$1]($2)")
    .replace(/<img[^>]*src="([^"]*)"/gi, "![image]($1)")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `- ${stripTags(t)}\n`)
    .replace(/<[ou]l[^>]*>([\s\S]*?)<\/[ou]l>/gi, "$1\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, t) => `${stripTags(t)}\n\n`)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseInitialContent(value) {
  if (!value || !value.trim()) return "";
  if (isRichContent(value)) return value;
  return renderMarkdown(value);
}

const FONT_FAMILIES = [
  { label: "기본 글꼴", value: "" },
  { label: "IBM Plex Sans", value: '"IBM Plex Sans", sans-serif' },
  { label: "Noto Sans KR", value: '"Noto Sans KR", sans-serif' },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier New", value: '"Courier New", monospace' },
];

const FONT_SIZES = [
  { label: "기본 크기", value: "" },
  { label: "12px", value: "12px" },
  { label: "14px", value: "14px" },
  { label: "16px", value: "16px" },
  { label: "18px", value: "18px" },
  { label: "20px", value: "20px" },
  { label: "24px", value: "24px" },
  { label: "32px", value: "32px" },
];

// TipTap 편집 중 인증 이미지를 표시하는 NodeView
// getHTML()은 node.attrs.src(원본 URL)를 사용하므로 저장에는 영향 없음
function AuthenticatedImageView({ node }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const src = node.attrs.src;

  useEffect(() => {
    if (!src || !src.includes("/uploads/")) return;
    const token = sessionStorage.getItem("study-note-token");
    let objectUrl = null;
    fetch(src, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {});
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return (
    <NodeViewWrapper>
      <img src={blobUrl || src} alt={node.attrs.alt || ""} style={{ maxWidth: "100%", height: "auto" }} />
    </NodeViewWrapper>
  );
}

const AuthenticatedImage = Image.configure({ inline: false, allowBase64: false }).extend({
  addNodeView() {
    return ReactNodeViewRenderer(AuthenticatedImageView);
  },
});

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      className={`editorToolbarBtn${active ? " editorToolbarBtn--active" : ""}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

export default function RichEditor({ value, onChange, disabled, placeholder, minHeight = "200px" }) {
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const richPreviewRef = useRef(null);
  const mdPreviewRef = useRef(null);

  // 초기 모드: 내용이 HTML이면 텍스트 편집기, 아니면 마크다운
  const [mode, setMode] = useState(() => {
    if (!value || !value.trim()) return "rich";
    return isRichContent(value) ? "rich" : "markdown";
  });
  const [richSub, setRichSub] = useState("edit"); // "edit" | "preview"
  const [mdSub, setMdSub] = useState("edit");     // "edit" | "preview"

  // 미리보기 영역의 인증 이미지 처리
  useAuthenticatedImages(richPreviewRef);
  useAuthenticatedImages(mdPreviewRef);

  // onUpdate 클로저가 stale mode를 캡처하지 않도록 ref로 동기화
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      AuthenticatedImage,
    ],
    content: parseInitialContent(value),
    editable: !disabled && mode === "rich",
    onUpdate: ({ editor }) => {
      // 텍스트 편집기 모드일 때만 HTML을 부모에 전달
      if (modeRef.current === "rich") {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith("image/"));
        if (!imageItem) return false;
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (!file) return false;
        uploadImage(file).then((result) => {
          if (result.success && result.data?.url) {
            const { schema, tr } = view.state;
            if (schema.nodes.image) {
              const node = schema.nodes.image.create({ src: result.data.url });
              view.dispatch(tr.replaceSelectionWith(node));
            }
          }
        });
        return true;
      },
    },
  });

  // 외부 value 변경 동기화 — 텍스트 편집기 모드에서만 TipTap에 반영
  useEffect(() => {
    if (!editor) return;
    if (mode !== "rich") return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(parseInitialContent(value), false);
    }
  }, [editor, value, mode]);

  // disabled / 모드 / 서브탭 변경 시 편집 가능 여부 동기화
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled && mode === "rich" && richSub === "edit");
  }, [editor, disabled, mode, richSub]);

  // 마크다운 textarea 자동 높이 조절
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, parseInt(minHeight))}px`;
  }, [value, mode, minHeight]);

  const handleSwitchToMarkdown = () => {
    if (mode === "markdown") return;
    const html = editor?.getHTML() || "";
    const md = htmlToMarkdown(html);
    onChange(md);
    setMode("markdown");
  };

  const handleSwitchToRich = () => {
    if (mode === "rich") return;
    if (editor) {
      editor.commands.setContent(parseInitialContent(value), false);
    }
    setMode("rich");
  };

  const handleMarkdownChange = (e) => {
    onChange(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, parseInt(minHeight))}px`;
  };

  const handleMarkdownPaste = useCallback(
    async (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (!imageItem) return;
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;
      const result = await uploadImage(file).catch(() => null);
      if (result?.success && result.data?.url) {
        const url = result.data.url;
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const current = value || "";
        onChange(current.slice(0, start) + `![image](${url})` + current.slice(end));
      }
    },
    [value, onChange],
  );

  const handleImageUpload = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;
      e.target.value = "";
      const result = await uploadImage(file).catch(() => null);
      if (result?.success && result.data?.url) {
        editor.chain().focus().setImage({ src: result.data.url }).run();
      }
    },
    [editor],
  );

  if (!editor) return null;

  const currentFontFamily = editor.getAttributes("textStyle").fontFamily || "";
  const currentFontSize = editor.getAttributes("textStyle").fontSize || "";
  const headingLevel = [1, 2, 3].find((l) => editor.isActive("heading", { level: l }));
  const headingValue = headingLevel ? `h${headingLevel}` : "p";
  const isEmpty = editor.isEmpty;

  return (
    <div className={`richEditor${disabled ? " richEditor--disabled" : ""}`}>
      {/* 모드 전환 탭 */}
      {!disabled && (
        <div className="editorModeBar">
          <button
            type="button"
            className={`editorModeBtn${mode === "rich" ? " editorModeBtn--active" : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSwitchToRich}
          >
            텍스트 편집기
          </button>
          <button
            type="button"
            className={`editorModeBtn${mode === "markdown" ? " editorModeBtn--active" : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSwitchToMarkdown}
          >
            마크다운
          </button>
        </div>
      )}

      {/* 텍스트 편집기 서브 탭 */}
      {mode === "rich" && !disabled && (
        <div className="editorSubTabs">
          <button
            type="button"
            className={`editorSubTab${richSub === "edit" ? " editorSubTab--active" : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setRichSub("edit")}
          >
            편집
          </button>
          <button
            type="button"
            className={`editorSubTab${richSub === "preview" ? " editorSubTab--active" : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setRichSub("preview")}
          >
            미리보기
          </button>
        </div>
      )}

      {/* 텍스트 편집기 툴바 — 편집 탭에서만 표시 */}
      {mode === "rich" && richSub === "edit" && !disabled && (
        <div className="editorToolbar" role="toolbar" aria-label="텍스트 서식">
          <select
            className="editorSelect editorSelect--wide"
            value={headingValue}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "p") editor.chain().focus().setParagraph().run();
              else editor.chain().focus().toggleHeading({ level: parseInt(v[1]) }).run();
            }}
            title="단락 스타일"
          >
            <option value="p">본문</option>
            <option value="h1">제목 1</option>
            <option value="h2">제목 2</option>
            <option value="h3">제목 3</option>
          </select>

          <span className="editorSep" />

          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="굵게 (Ctrl+B)">
            <strong>B</strong>
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="기울임 (Ctrl+I)">
            <em>I</em>
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="밑줄 (Ctrl+U)">
            <span style={{ textDecoration: "underline" }}>U</span>
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="취소선">
            <span style={{ textDecoration: "line-through" }}>S</span>
          </ToolbarBtn>

          <span className="editorSep" />

          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="왼쪽 정렬">좌</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="가운데 정렬">중</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="오른쪽 정렬">우</ToolbarBtn>

          <span className="editorSep" />

          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="글머리 목록">• 목록</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="번호 목록">1. 목록</ToolbarBtn>

          <span className="editorSep" />

          <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="인라인 코드">코드</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="코드 블록">블록</ToolbarBtn>

          <span className="editorSep" />

          <ToolbarBtn onClick={() => fileInputRef.current?.click()} title="이미지 삽입">사진</ToolbarBtn>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />

          <span className="editorSep" />

          <select
            className="editorSelect"
            value={currentFontFamily}
            onChange={(e) => {
              const v = e.target.value;
              if (v) editor.chain().focus().setFontFamily(v).run();
              else editor.chain().focus().unsetFontFamily().run();
            }}
            title="글꼴"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.label} value={f.value}>{f.label}</option>
            ))}
          </select>

          <select
            className="editorSelect"
            value={currentFontSize}
            onChange={(e) => {
              const v = e.target.value;
              if (v) editor.chain().focus().setFontSize(v).run();
              else editor.chain().focus().unsetFontSize().run();
            }}
            title="글자 크기"
          >
            {FONT_SIZES.map((s) => (
              <option key={s.label} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* 텍스트 편집기 편집 영역 */}
      {mode === "rich" && richSub === "edit" && (
        <div
          className="editorContentWrap"
          style={{ minHeight }}
          data-empty={isEmpty || undefined}
          data-placeholder={placeholder}
        >
          <EditorContent editor={editor} className="editorContent" />
        </div>
      )}

      {/* 텍스트 편집기 미리보기 */}
      {mode === "rich" && richSub === "preview" && (
        <div
          ref={richPreviewRef}
          className="markdownBody editorMarkdownPreview"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: renderContent(value) || "<p class='editorPreviewEmpty'>내용을 입력하면 여기에 표시됩니다.</p>" }}
        />
      )}

      {/* 마크다운 서브 탭 */}
      {mode === "markdown" && !disabled && (
        <div className="editorSubTabs">
          <button
            type="button"
            className={`editorSubTab${mdSub === "edit" ? " editorSubTab--active" : ""}`}
            onClick={() => setMdSub("edit")}
          >
            편집
          </button>
          <button
            type="button"
            className={`editorSubTab${mdSub === "preview" ? " editorSubTab--active" : ""}`}
            onClick={() => setMdSub("preview")}
          >
            미리보기
          </button>
        </div>
      )}

      {/* 마크다운 편집 영역 */}
      {mode === "markdown" && mdSub === "edit" && (
        <textarea
          ref={textareaRef}
          className="markdownTextarea"
          value={value || ""}
          onChange={handleMarkdownChange}
          onPaste={handleMarkdownPaste}
          placeholder={placeholder}
          disabled={disabled}
          style={{ minHeight }}
          spellCheck={false}
        />
      )}

      {/* 마크다운 미리보기 영역 */}
      {mode === "markdown" && mdSub === "preview" && (
        <div
          ref={mdPreviewRef}
          className="markdownBody editorMarkdownPreview"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: renderContent(value) || "<p class='editorPreviewEmpty'>내용을 입력하면 여기에 표시됩니다.</p>" }}
        />
      )}
    </div>
  );
}
