"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";

type Props = {
  value: string;
  onChange: (html: string) => void;
  dir?: "rtl" | "ltr";
  placeholder?: string;
  className?: string;
};

function Btn({
  active,
  disabled,
  onClick,
  children,
  title
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        "rounded-lg border px-3 py-1 text-xs transition",
        "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-zinc-950/40 dark:hover:bg-zinc-950/60",
        active ? "ring-2 ring-black/10 dark:ring-white/10" : "",
        disabled ? "cursor-not-allowed opacity-50" : ""
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  dir = "rtl",
  placeholder = "اكتب الوصف هنا…",
  className = ""
}: Props) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] }
        }),
        Underline,
        TextStyle,
        Color,
        Link.configure({
          openOnClick: false,
          autolink: true,
          linkOnPaste: true
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"]
        })
      ],
      content: value || "",
      editorProps: {
        attributes: {
          dir,
          "data-placeholder": placeholder,
          class: [
            "min-h-[220px] w-full rounded-xl border border-black/10 bg-white/70 p-3 text-sm outline-none",
            "dark:border-white/10 dark:bg-zinc-950/40",
            "prose prose-zinc max-w-none dark:prose-invert",
            "focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10",
            "rich-editor"
          ].join(" ")
        }
      },
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      }
    },
    [dir]
  );

  React.useEffect(() => {
    if (!editor) return;

    const current = editor.getHTML();
    const next = value || "";

    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  const setLink = React.useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("ضع الرابط:", previousUrl || "");

    if (url === null) return;

    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const unsetLink = React.useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  }, [editor]);

  if (!mounted) return null;

  const canUndo = !!editor?.can().chain().focus().undo().run();
  const canRedo = !!editor?.can().chain().focus().redo().run();

  return (
    <div className={["space-y-2", className].join(" ")}>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-black/10 bg-white/60 p-2 dark:border-white/10 dark:bg-zinc-950/40">
        <Btn
          title="Bold"
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          B
        </Btn>

        <Btn
          title="Italic"
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          I
        </Btn>

        <Btn
          title="Underline"
          active={editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          U
        </Btn>

        <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/10" />

        <Btn
          title="H1"
          active={editor?.isActive("heading", { level: 1 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </Btn>

        <Btn
          title="H2"
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Btn>

        <Btn
          title="H3"
          active={editor?.isActive("heading", { level: 3 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Btn>

        <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/10" />

        <Btn
          title="Bullets"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          • List
        </Btn>

        <Btn
          title="Numbered"
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </Btn>

        <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/10" />

        <Btn
          title="Align left"
          active={editor?.isActive({ textAlign: "left" })}
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        >
          ⬅
        </Btn>

        <Btn
          title="Align center"
          active={editor?.isActive({ textAlign: "center" })}
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        >
          ↔
        </Btn>

        <Btn
          title="Align right"
          active={editor?.isActive({ textAlign: "right" })}
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
        >
          ➡
        </Btn>

        <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/10" />

        <Btn title="Add link" active={editor?.isActive("link")} onClick={setLink}>
          Link
        </Btn>

        <Btn title="Remove link" onClick={unsetLink}>
          Unlink
        </Btn>

        <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/10" />

        <label className="flex items-center gap-2 text-xs opacity-80">
          Color
          <input
            type="color"
            onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
            className="h-8 w-10 cursor-pointer rounded-md border border-black/10 bg-transparent p-1 dark:border-white/10"
            title="Text color"
          />
        </label>

        <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/10" />

        <Btn
          title="Undo"
          disabled={!canUndo}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          Undo
        </Btn>

        <Btn
          title="Redo"
          disabled={!canRedo}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          Redo
        </Btn>
      </div>

      <EditorContent editor={editor} />

      <style jsx global>{`
        .rich-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(120, 120, 120, 0.7);
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}