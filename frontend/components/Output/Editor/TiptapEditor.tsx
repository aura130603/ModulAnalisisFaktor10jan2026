"use client";

import React, { useEffect, memo, useCallback, useMemo } from "react";
import "./editor.css"; // dedicated editor styles
import { cn } from "@/lib/utils";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import debounce from "lodash/debounce";

interface SimpleRichTextEditorProps {
  /** Current HTML value of the editor */
  value: string;
  /** Called whenever the editor content changes */
  onChange: (value: string) => void;
  /** Set to true to allow editing, otherwise the editor is rendered in read-only mode */
  editable?: boolean;
  /** Optional save handler. When provided, a primary Save button will appear */
  onSave?: () => void;
  /** Placeholder text when the editor is empty */
  placeholder?: string;
  /** Optional id for accessibility / testing purposes */
  id?: string;
  /** Optional additional className */
  className?: string;
}

// Memisahkan MenuBar ke komponen terpisah dan menggunakan memo
type MenuState = {
  isBold: boolean;
  isItalic: boolean;
  isStrike: boolean;
  isCode: boolean;
  isH1: boolean;
  isH2: boolean;
  isH3: boolean;
  isBulletList: boolean;
  isOrderedList: boolean;
  isBlockquote: boolean;
  isParagraph: boolean;
  canToggleBold: boolean;
  canToggleItalic: boolean;
  canToggleStrike: boolean;
  canToggleCode: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

const MenuBar = memo(({ editor, editorState }: { editor: Editor | null; editorState: MenuState }) => {
  if (!editor || !editorState) return null;

  const buttonClass = (active: boolean) =>
    cn(
      "px-1.5 py-0.5 text-sm rounded-sm hover:bg-muted/70",
      active && "bg-primary text-primary-foreground"
    );

  return (
    <div className="flex flex-wrap gap-1 rounded mb-2 p-1 bg-muted/50">
      {/* Bold */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editorState.isBold)}
      >
        Bold
      </button>
      {/* Italic */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editorState.isItalic)}
      >
        Italic
      </button>
      {/* Paragraph */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={buttonClass(editorState.isParagraph)}
      >
        P
      </button>
      {/* Strike */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={buttonClass(editorState.isStrike)}
      >
        Strike
      </button>
      {/* Inline code */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={buttonClass(editorState.isCode)}
      >
        Code
      </button>
      {/* Bullet list */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editorState.isBulletList)}
      >
        • List
      </button>
      {/* Ordered list */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editorState.isOrderedList)}
      >
        1. List
      </button>
      {/* H1 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClass(editorState.isH1)}
      >
        H1
      </button>
      {/* H2 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editorState.isH2)}
      >
        H2
      </button>
      {/* Blockquote */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={buttonClass(editorState.isBlockquote)}
      >
        Blockquote
      </button>
      {/* Horizontal Rule */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="px-1.5 py-0.5 text-sm rounded-sm hover:bg-muted/70"
      >
        HR
      </button>
      {/* Undo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        className="px-1.5 py-0.5 text-sm rounded-sm hover:bg-muted/70"
        disabled={!editorState.canUndo}
      >
        Undo
      </button>
      {/* Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        className="px-1.5 py-0.5 text-sm rounded-sm hover:bg-muted/70"
        disabled={!editorState.canRedo}
      >
        Redo
      </button>
    </div>
  );
});

MenuBar.displayName = "MenuBar";

const SaveButton = ({ onSave }: { onSave: () => void }) => (
  <div className="flex justify-end">
    <button
      type="button"
      onClick={onSave}
      className="px-3 py-1 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      Simpan
    </button>
  </div>
);

const TiptapEditableView: React.FC<Omit<SimpleRichTextEditorProps, 'editable'>> = memo(({
  value,
  onChange,
  onSave,
  placeholder = "Tulis deskripsi statistik di sini…",
  id,
  className,
}) => {
  // Debounce perubahan agar tidak mem-trigger state set terlalu sering
  const debouncedChange = useMemo(
    () => debounce((html: string) => onChange(html), 300),
    [onChange]
  );

  const handleUpdate = useCallback(({ editor }: { editor: Editor }) => {
    debouncedChange(editor.getHTML());
  }, [debouncedChange]);

  const editor = useEditor({
    extensions: [
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      TextStyle,
      Color.configure({ types: [TextStyle.name, ListItem.name] }),
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "<p></p>",
    shouldRerenderOnTransaction: false,
    onUpdate: handleUpdate,
    immediatelyRender: true,
  });

  const editorState = useEditorState({
    editor,
    selector: (state) => {
      const { editor } = state;
      if (!editor) {
        return {
          isBold: false, isItalic: false, isStrike: false, isCode: false,
          isH1: false, isH2: false, isH3: false, isBulletList: false, isOrderedList: false, isBlockquote: false,
          isParagraph: false,
          canToggleBold: false, canToggleItalic: false, canToggleStrike: false, canToggleCode: false,
          canUndo: false, canRedo: false,
        };
      }
      return {
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isStrike: editor.isActive("strike"),
        isCode: editor.isActive("code"),
        isParagraph: editor.isActive("paragraph"),
        isH1: editor.isActive("heading", { level: 1 }),
        isH2: editor.isActive("heading", { level: 2 }),
        isH3: editor.isActive("heading", { level: 3 }),
        isBulletList: editor.isActive("bulletList"),
        isOrderedList: editor.isActive("orderedList"),
        isBlockquote: editor.isActive("blockquote"),
        canToggleBold: editor.can().chain().focus().toggleBold().run(),
        canToggleItalic: editor.can().chain().focus().toggleItalic().run(),
        canToggleStrike: editor.can().chain().focus().toggleStrike().run(),
        canToggleCode: editor.can().chain().focus().toggleCode().run(),
        canUndo: editor.can().chain().focus().undo().run(),
        canRedo: editor.can().chain().focus().redo().run(),
      };
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>", false);
    }
    return () => debouncedChange.cancel();
  }, [value, editor, debouncedChange]);

  if (!editor) {
    return (
      <div id={id} className={cn("border rounded-md p-2 min-h-[120px] bg-background text-sm text-muted-foreground", className)}>
        Memuat editor…
      </div>
    );
  }

  return (
    <div
      id={id}
      className={cn("space-y-2 border rounded-md p-2 bg-background", className)}
    >
      {/* Menu bar */}
      <MenuBar editor={editor} editorState={editorState} />
      <div className="tiptap-wrapper">
        <EditorContent
          editor={editor}
          className="prose max-w-none tiptap px-4 py-2"
        />
      </div>
      {onSave && <SaveButton onSave={onSave} />}
    </div>
  );
});

TiptapEditableView.displayName = "TiptapEditableView";

const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = memo((props) => {
  const {
    editable = false,
    value,
    id,
    className,
  } = props;

  // Read-only view
  if (!editable) {
    return (
      <div
        id={id}
        className={cn(
          "border rounded-md px-4 py-2 bg-background prose max-w-none max-h-96 overflow-auto",
          className
        )}
        dangerouslySetInnerHTML={{
          __html:
            value && value.trim() !== ""
              ? value
              : '<p class="text-muted-foreground">No description.</p>',
        }}
      />
    );
  }

  return <TiptapEditableView {...props} />;
});

SimpleRichTextEditor.displayName = "SimpleRichTextEditor";

export default SimpleRichTextEditor;
