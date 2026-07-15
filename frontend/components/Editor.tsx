"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect, useRef, useState } from "react";
import Spinner from "./Spinner";

type SaveState = "saved" | "saving" | "error";

export default function DocEditor({
  initialContent,
  editable,
  onSave,
}: {
  initialContent: string;
  editable: boolean;
  onSave: (content: string) => Promise<void>;
}) {
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialContent,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-neutral max-w-none focus:outline-none min-h-[60vh]",
      },
    },
    onUpdate: ({ editor }) => {
      if (!editable) return;
      setSaveState("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(editor.getHTML()), 800);
    },
  });

  async function save(content: string) {
    try {
      await onSave(content);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div>
      {editable && (
        <div className="mb-3 flex items-center justify-between">
          <Toolbar editor={editor} />
          <span
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              saveState === "error" ? "text-red-500" : "text-neutral-400"
            }`}
          >
            {saveState === "saving" && <Spinner className="h-3 w-3" />}
            {saveState === "saving" && "Saving…"}
            {saveState === "saved" && "Saved"}
            {saveState === "error" && "Couldn't save"}
          </span>
        </div>
      )}
      <div className="rounded-lg border border-neutral-200 px-6 py-4 transition-shadow focus-within:shadow-sm">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const buttons: { label: string; title: string; active: boolean; onClick: () => void }[] = [
    {
      label: "B",
      title: "Bold",
      active: editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "I",
      title: "Italic",
      active: editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "U",
      title: "Underline",
      active: editor.isActive("underline"),
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: "H1",
      title: "Heading 1",
      active: editor.isActive("heading", { level: 1 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "H2",
      title: "Heading 2",
      active: editor.isActive("heading", { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "• List",
      title: "Bulleted list",
      active: editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "1. List",
      title: "Numbered list",
      active: editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ];

  return (
    <div className="flex flex-wrap gap-1">
      {buttons.map((b) => (
        <button
          key={b.title}
          type="button"
          title={b.title}
          onClick={b.onClick}
          className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-all active:scale-90 ${
            b.active ? "bg-neutral-900 text-white" : "bg-neutral-100 hover:bg-neutral-200"
          }`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
