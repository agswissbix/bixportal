"use client"

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

const ReadOnlyEditor = ({ content }: { content: string }) => {
  const editor = useEditor({
    editable: false,
    content: content,
    extensions: [
      StarterKit,
      Markdown,
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        // Assicurati che 'prose' sia presente per vedere lo styling (grassetto, titoli, ecc.)
        class: 'prose prose-sm dark:prose-invert focus:outline-none max-w-none',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return <EditorContent editor={editor} />;
};

export default ReadOnlyEditor;