'use client';

import React, { useMemo, useState } from 'react';
import { createEditor, Descendant, Transforms, Element as SlateElement, Text, BaseEditor } from 'slate';
import { Slate, Editable, withReact, useSlate, ReactEditor } from 'slate-react';
import { HistoryEditor, withHistory } from 'slate-history';
import { Bold, Italic, Underline, List, Image as ImageIcon } from 'lucide-react';

interface PropsInterface {
  initialValue?: string; // HTML iniziale
  onChange?: (value: string) => void; // restituisce HTML serializzato
  tableid?: string;
  recordid?: string;
  fieldid?: string;
}

export type CustomText = {
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    code?: boolean;
};

export type ParagraphElement = {
    type: "paragraph";
    children: (CustomText | CustomElement)[];
};

export type BulletedListElement = {
    type: "bulleted-list";
    children: Array<ListItemElement | CustomText | CustomElement>;
};

export type ListItemElement = {
    type: "list-item";
    children: (CustomText | CustomElement)[];
};

export type ImageElement = {
    type: "image";
    url: string;
    children: CustomText[];
};

export type CustomElement =
    | ParagraphElement
    | BulletedListElement
    | ListItemElement
    | ImageElement;

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

declare module "slate" {
    interface CustomTypes {
        Editor: CustomEditor;
        Element: CustomElement;
        Text: CustomText;
    }
}

export default function InputEditor({ initialValue = '', onChange, tableid, recordid, fieldid }: PropsInterface) {
  const editor = useMemo(() => withImages(withHistory(withReact(createEditor()))), []);
  const [value, setValue] = useState<Descendant[]>(htmlToSlate(initialValue));

  const handleChange = (newValue: Descendant[]) => {
    setValue(newValue);
    if (onChange) onChange(serialize(newValue));
  };

  const handleSave = async () => {
    const htmlContent = serialize(value);
    const formData = new FormData();
    if (tableid) formData.append('tableid', tableid);
    if (recordid) formData.append('recordid', recordid);
    if (fieldid) formData.append('fields', JSON.stringify({ [fieldid]: htmlContent }));

    try {
      const res = await fetch('/api/save-record', { method: 'POST', body: formData });
      if (res.ok) alert('Salvato correttamente!');
      else alert('Errore durante il salvataggio');
    } catch (error) {
      console.error(error);
      alert('Errore di connessione');
    }
  };

  return (
      <div className="border rounded-md shadow-sm p-2 w-full">
          <Slate
              editor={editor}
              initialValue={value}
              onChange={handleChange}>
              <Toolbar />
              <Editable
                  className="min-h-[200px] p-2 focus:outline-none"
                  placeholder="Scrivi qui..."
                  renderElement={(props) => <Element {...props} />}
                  renderLeaf={(props) => <Leaf {...props} />}
              />
          </Slate>
          <button
              onClick={handleSave}
              className="mt-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
              Salva
          </button>
      </div>
  );
}

// Toolbar
const Toolbar = () => {
  const editor = useSlate();
  return (
    <div className="flex gap-2 border-b pb-1 mb-2">
      <ToolbarButton format="bold" icon={<Bold size={16} />} />
      <ToolbarButton format="italic" icon={<Italic size={16} />} />
      <ToolbarButton format="underline" icon={<Underline size={16} />} />
      <ToolbarButton format="bulleted-list" icon={<List size={16} />} />
      <InsertImageButton />
    </div>
  );
};

const ToolbarButton = ({ format, icon }: { format: string; icon: React.ReactNode }) => {
  const editor = useSlate();
  return (
    <button
      type="button"
      onMouseDown={event => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
      className="p-1 hover:bg-gray-200 rounded"
    >
      {icon}
    </button>
  );
};

// Toggle mark
const toggleMark = (editor: any, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) editor.removeMark(format);
  else editor.addMark(format, true);
};

const isMarkActive = (editor: any, format: string) => {
  const marks = editor.marks() || {};
  return marks[format] === true;
};

// Leaf render per mark
const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) children = <strong>{children}</strong>;
  if (leaf.italic) children = <em>{children}</em>;
  if (leaf.underline) children = <u>{children}</u>;
  return <span {...attributes}>{children}</span>;
};

// Immagini
const withImages = (editor: any) => {
  const { insertData, isVoid } = editor;

  editor.isVoid = element => element.type === 'image' ? true : isVoid(element);

  editor.insertData = (data: DataTransfer) => {
    const files = data.files;
    if (files && files.length > 0) {
      for (const file of files) {
        const reader = new FileReader();
        const [mime] = file.type.split('/');
        if (mime === 'image') {
          reader.addEventListener('load', () => insertImage(editor, reader.result as string));
          reader.readAsDataURL(file);
        }
      }
    } else insertData(data);
  };

  return editor;
};

const insertImage = (editor: any, url: string) => {
  const text = { text: "" };
  const image: ImageElement = { type: "image", url, children: [text] };
  Transforms.insertNodes(editor, image);
};

const InsertImageButton = () => {
  const editor = useSlate();
  return (
    <button
      type="button"
      onMouseDown={event => {
        event.preventDefault();
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = async () => {
          if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json(); // { url: '...' }
            insertImage(editor, data.url);
          }
        };
        fileInput.click();
      }}
      className="p-1 hover:bg-gray-200 rounded"
    >
      <ImageIcon size={16} />
    </button>
  );
};

// Element render
const Element = ({ attributes, children, element }: any) => {
  switch (element.type) {
    case 'image':
      return <img {...attributes} src={element.url} alt="" className="max-w-full my-2" />;
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>;
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    case 'paragraph':
    default:
      return <p {...attributes}>{children}</p>;
  }
};

// Serialize Slate -> HTML
const serialize = (nodes: Descendant[]): string => {
  return nodes.map(n => NodeToHtml(n)).join('');
};

const NodeToHtml = (node: Descendant): string => {
  if (Text.isText(node)) {
    let text = node.text;
    if ((node as any).bold) text = `<strong>${text}</strong>`;
    if ((node as any).italic) text = `<em>${text}</em>`;
    if ((node as any).underline) text = `<u>${text}</u>`;
    return text;
  }

  if (!SlateElement.isElement(node)) return '';

  const children = node.children.map(n => NodeToHtml(n)).join('');

  if ('type' in node) {
    switch (node.type) {
      case 'paragraph': return `<p>${children}</p>`;
      case 'bulleted-list': return `<ul>${children}</ul>`;
      case 'list-item': return `<li>${children}</li>`;
      case 'image': return `<img src="${(node as any).url}" />`;
      default: return children;
    }
  }
  return children;
};

// Parse HTML -> Slate
const htmlToSlate = (html: string): Descendant[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const parseNode = (node: ChildNode): Descendant[] => {
    if (node.nodeType === Node.TEXT_NODE) {
      return [{ text: node.textContent || '' }];
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const children = Array.from(el.childNodes).flatMap(parseNode);

      switch (el.tagName.toLowerCase()) {
        case 'strong': return children.map(c => ({ ...c, bold: true }));
        case 'em': return children.map(c => ({ ...c, italic: true }));
        case 'u': return children.map(c => ({ ...c, underline: true }));
        case 'p': return [{ type: 'paragraph', children }];
        case 'ul': return [{ type: 'bulleted-list', children }];
        case 'li': return [{ type: 'list-item', children }];
        case 'img': return [{ type: 'image', url: el.getAttribute('src'), children: [{ text: '' }] }];
        default: return children;
      }
    }
    return [];
  };

  return Array.from(doc.body.childNodes).flatMap(parseNode);
};
