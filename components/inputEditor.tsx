import React, { useEffect, useRef } from 'react';
import '@toast-ui/editor/dist/toastui-editor.css';
import Editor, { EditorOptions } from '@toast-ui/editor';

interface PropsInterface {
  initialValue?: string;
  onChange?: (value: string) => void;
}

export default function InputEditor({ initialValue = '', onChange }: PropsInterface) {
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dummyRef = useRef<HTMLDivElement>(null); // Elemento fittizio per gestire il blur

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      // Salva l'elemento attivo
      const activeElement = document.activeElement;

      editorRef.current = new Editor({
        el: containerRef.current,
        height: '300px',
        width: '100%',
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        initialValue: '',
        autofocus: false,
        customHTMLSanitizer: (html: string) => html,
        hooks: {
          addImageBlobHook: () => Promise.resolve(''),
        },
      } as EditorOptions);

      if (initialValue) {
        editorRef.current.setHTML(initialValue);
      }

      // Focus sul primo input del form e poi blur immediato
      setTimeout(() => {
        const firstField = document.querySelector(
          '[class*="space-y-3"] input:not([type="hidden"]), ' +
          '[class*="space-y-3"] textarea, ' +
          '[class*="space-y-3"] [contenteditable]:not(.toastui-editor *)'
        ) as HTMLElement | null;

        if (firstField) {
          firstField.focus();
          firstField.blur();
        } else {
          // Se non c'è alcun campo, usa il dummy invisibile
          // dummyRef.current?.focus();
          // dummyRef.current?.blur();
        }
      }, 100);

      // Listener per onChange
      editorRef.current.on('change', () => {
        if (onChange && editorRef.current) {
          onChange(editorRef.current.getHTML());
        }
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current && editorRef.current.getHTML() !== initialValue) {
      editorRef.current.setHTML(initialValue);
    }
  }, [initialValue]);

  return (
    <div className="flex flex-col">
      <div>
        <div
          ref={containerRef}
          className="flex items-center rounded-md bg-white p-3 shadow-sm focus-within:outline-none focus-within:ring-1 focus-within:ring-gray-200 focus-within:ring-offset-2 transition-all duration-300 w-full"
          onFocus={e => e.currentTarget.blur()} // Previeni focus sul container
        ></div>
        {/* Dummy element per gestire il blur quando non c'è nessun input */}
        <div tabIndex={-1} ref={dummyRef} />
      </div>
    </div>
  );
}
