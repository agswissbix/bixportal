import React, { useEffect, useRef } from 'react';
import '@toast-ui/editor/dist/toastui-editor.css';
import Editor, { EditorOptions } from '@toast-ui/editor';

// INTERFACCIA PROPS
interface PropsInterface {
  initialValue?: string;
  onChange?: (value: string) => void;
}

export default function InputEditor({ initialValue='', onChange }: PropsInterface) {
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Inizializza l'editor
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      // *** SOLUZIONE ALTERNATIVA 1: Salva e ripristina l'elemento attivo ***
      const activeElement = document.activeElement;

      // Inizializza l'editor solo se non è già stato creato
      editorRef.current = new Editor({
        el: containerRef.current as HTMLElement,
        height: '300px',
        width: '100%',
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        initialValue: '',
        autofocus: false,
        customHTMLSanitizer: (html: string): string => html,
      } as EditorOptions);

      // Imposta il contenuto se presente
      if (initialValue) {
        editorRef.current.setHTML(initialValue);
      }

      // *** SOLUZIONE MODIFICATA: Focus sul primo campo del form ***
      setTimeout(() => {
        // Forza il blur su tutto l'editor corrente
        const allFocusableElements = containerRef.current?.querySelectorAll(
          'input, textarea, [contenteditable], button, select, [tabindex]:not([tabindex="-1"])'
        );
        allFocusableElements?.forEach(el => (el as HTMLElement).blur());
        
        // Trova il primo campo input nel componente padre (CardFields)
        const firstFormField = document.querySelector(
          '[class*="space-y-3"] input:not([type="hidden"]), ' +
          '[class*="space-y-3"] textarea:not(.toastui-editor *), ' +
          '[class*="space-y-3"] select, ' +
          '[class*="space-y-3"] [contenteditable]:not(.toastui-editor *)'
        );
        
        if (firstFormField) {
          (firstFormField as HTMLElement).focus();
        } else {
          // Fallback: prova a trovare il primo elemento focusabile nella pagina
          const firstInput = document.querySelector('input:not([type="hidden"]):not(.toastui-editor *), textarea:not(.toastui-editor *), select:not(.toastui-editor *)');
          if (firstInput) {
            (firstInput as HTMLElement).focus();
          }
        }
      }, 150);

      // Aggiungi un listener per l'evento di modifica
      editorRef.current.on('change', () => {
        if (onChange && editorRef.current) {
          const htmlContent = editorRef.current.getHTML();
          onChange(htmlContent);
        }
      });
    }

    // Distruggi l'editor quando il componente viene smontato
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  /* Aggiorna il contenuto quando la prop cambia */
  useEffect(() => {
    if (editorRef.current) {
      const current = editorRef.current.getHTML();
      if (current !== initialValue) {
        editorRef.current.setHTML(initialValue ?? '');
        
        // *** SOLUZIONE 3: Blur dopo ogni aggiornamento ***
        setTimeout(() => {
          const editorElement = containerRef.current?.querySelector('.toastui-editor');
          if (editorElement) {
            (editorElement as HTMLElement).blur();
          }
        }, 50);
      }
    }
  }, [initialValue]);

  return (
    <div className="flex flex-col">
      <div className="">
        <div
          ref={containerRef}
          className="flex items-center rounded-md bg-white p-3 shadow-sm focus-within:outline-none focus-within:ring-1 focus-within:ring-gray-200 focus-within:ring-offset-2 transition-all duration-300 w-full"
          // *** SOLUZIONE 4: Previeni il focus sul container ***
          onFocus={(e) => {
            e.preventDefault();
            e.currentTarget.blur();
          }}
        ></div>
      </div>
    </div>
  );
}