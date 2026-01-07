"use client";

import {
    useEditor,
    EditorContent,
    ReactNodeViewRenderer,
    NodeViewContent,
    NodeViewWrapper,
} from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import {
    Table,
    TableRow,
    TableCell,
    TableHeader,
} from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Link } from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { toast } from "sonner";

import { uploadImageService } from "@/utils/mediaUploadService";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

import {
    Bold,
    Italic,
    List,
    Table as TableIcon,
    Heading1,
    Heading2,
    Maximize,
    Minimize,
    Undo,
    Redo,
    Save,
    Code,
    Terminal,
    Link as LinkIcon,
    Check,
    Copy,
    Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef, ChangeEvent } from "react";

const lowlight = createLowlight(common);

const CodeBlockComponent = ({ node: { attrs }, getPos, editor }: any) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        const text = editor.state.doc.nodeAt(getPos()).textContent;
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Codice copiato!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <NodeViewWrapper className="relative group my-6">
            <div className="absolute right-3 top-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    type="button"
                    onClick={copyToClipboard}
                    className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 text-slate-500 transition-all flex items-center justify-center">
                    {copied ? (
                        <Check size={14} className="text-green-600" />
                    ) : (
                        <Copy size={14} />
                    )}
                </button>
            </div>
            <pre className="rounded-xl border border-slate-200 bg-slate-50 p-5 font-mono text-sm leading-relaxed overflow-x-auto">
                <NodeViewContent as={"code" as any} className="hljs" />
            </pre>
        </NodeViewWrapper>
    );
};

export default function MarkdownViewer({
    initialValue,
    onChange,
    onSaveRequested,
}: any) {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isSavingFlash, setIsSavingFlash] = useState(false);
    const [mounted, setMounted] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const lastValueRef = useRef(initialValue);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2] },
                codeBlock: false,
            }),
            Markdown.configure({
                html: false,
                tightLists: true,
                bulletListMarker: "-",
            }),
            CodeBlockLowlight.extend({
                addNodeView() {
                    return ReactNodeViewRenderer(CodeBlockComponent);
                },
            }).configure({ lowlight }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            Placeholder.configure({
                placeholder: "Inizia a scrivere... (Ctrl+S per salvare)",
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-600 underline cursor-pointer",
                },
            }),
            Image.configure({
                inline: false,
                allowBase64: false,
                HTMLAttributes: {
                    class: "rounded-xl shadow-md my-6 max-w-full h-auto border border-slate-100 mx-auto block",
                },
            }),
        ],
        content: initialValue,
        onUpdate: ({ editor }) => {
            const markdown = (editor.storage as any).markdown.getMarkdown();
            lastValueRef.current = markdown;
            onChange(markdown);
        },
        editorProps: {
            attributes: {
                class: "focus:outline-none min-h-[400px] p-8 sm:p-12 bg-white prose prose-slate max-w-none selection:bg-blue-100"
                    .replace(/\s+/g, " ")
                    .trim(),
            },
            handleKeyDown: (view, event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "s") {
                    event.preventDefault();
                    if (onSaveRequested) {
                        setIsSavingFlash(true);
                        onSaveRequested();
                        setTimeout(() => setIsSavingFlash(false), 500);
                    }
                    return true;
                }
                return false;
            },
            handlePaste: (view, event) => {
                const items = Array.from(event.clipboardData?.items || []);
                const images = items.filter(item => item.type.indexOf("image") === 0);

                if (images.length > 0) {
                    event.preventDefault();
                    images.forEach(item => {
                        const file = item.getAsFile();
                        if (file) handleImageUpload(file);
                    });
                    return true;
                }
                return false;
            },
            handleDrop: (view, event, slice, moved) => {
                const files = Array.from(event.dataTransfer?.files || []);
                const imageFiles = files.filter(file => file.type.startsWith("image/"));

                if (imageFiles.length > 0) {
                    event.preventDefault();
                    imageFiles.forEach(file => handleImageUpload(file));
                    return true;
                }
                return false;
            },
        },
    });

    const handleImageUpload = useCallback(async (file: File) => {
        if (!editor) return;

        try {
            const url = await uploadImageService(file);
            if (url) {
                editor.chain().focus().setImage({ src: url }).run();
            }
        } catch (error) {
            console.error("Errore inserimento immagine:", error);
            toast.error(`Errore caricamento: ${file.name}`);
        }
    }, [editor]);

    const triggerImageUpload = () => {
        fileInputRef.current?.click();
    };

    const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                await handleImageUpload(files[i]);
            }
            e.target.value = "";
        }
    };

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("Inserisci URL:", previousUrl);
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleFullScreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current
                .requestFullscreen()
                .catch((err) => toast.error(`Errore: ${err.message}`));
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handleFsChange);
        return () => document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

    useEffect(() => {
        if (editor && initialValue !== lastValueRef.current) {
            lastValueRef.current = initialValue;
            editor.commands.setContent(initialValue, { emitUpdate: false });
        }
    }, [initialValue, editor]);

    if (!editor || !mounted)
        return <div className="min-h-[400px] bg-slate-50 animate-pulse rounded-xl border border-slate-200" />;

    const ToolbarBtn = ({ onClick, active, children, title, highlight = false }: any) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-2 rounded-md transition-all duration-200 flex items-center justify-center
            ${active ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}
            ${highlight ? "text-blue-600 hover:bg-blue-50" : ""}`}
        >
            {children}
        </button>
    );

    return (
        <div
            ref={containerRef}
            className={`flex flex-col bg-white overflow-hidden transition-all duration-300 ${
                isFullScreen
                    ? "w-screen h-screen"
                    : "relative w-full h-full rounded-xl border border-slate-200 shadow-sm"
            }`}>
            <div className="sticky top-0 z-50 flex items-center justify-between px-3 py-2 border-b bg-white/95 backdrop-blur-sm flex-wrap gap-y-2">
                <div className="flex items-center flex-wrap gap-1 sm:gap-2">
                    <div className="flex items-center bg-slate-100/50 p-0.5 rounded-lg">
                        <ToolbarBtn
                            onClick={() =>
                                editor
                                    .chain()
                                    .focus()
                                    .toggleHeading({ level: 1 })
                                    .run()
                            }
                            active={editor.isActive("heading", { level: 1 })}
                            title="Titolo 1">
                            <Heading1 size={16} />
                        </ToolbarBtn>
                        <ToolbarBtn
                            onClick={() =>
                                editor.chain().focus().toggleBold().run()
                            }
                            active={editor.isActive("bold")}
                            title="Grassetto">
                            <Bold size={16} />
                        </ToolbarBtn>
                        <ToolbarBtn
                            onClick={() =>
                                editor.chain().focus().toggleItalic().run()
                            }
                            active={editor.isActive("italic")}
                            title="Corsivo">
                            <Italic size={16} />
                        </ToolbarBtn>
                        <ToolbarBtn
                            onClick={setLink}
                            active={editor.isActive("link")}
                            title="Link"
                            highlight>
                            <LinkIcon size={16} />
                        </ToolbarBtn>
                    </div>

                    <div className="flex items-center bg-slate-100/50 p-0.5 rounded-lg">
                        <ToolbarBtn
                            onClick={() =>
                                editor.chain().focus().toggleCode().run()
                            }
                            active={editor.isActive("code")}
                            title="Codice Inline">
                            <Code size={16} />
                        </ToolbarBtn>
                        <ToolbarBtn
                            onClick={() =>
                                editor.chain().focus().toggleCodeBlock().run()
                            }
                            active={editor.isActive("codeBlock")}
                            title="Blocco Codice">
                            <Terminal size={16} />
                        </ToolbarBtn>
                    </div>

                    <div className="flex items-center bg-slate-100/50 p-0.5 rounded-lg">
                        <ToolbarBtn
                            onClick={() =>
                                editor.chain().focus().toggleBulletList().run()
                            }
                            active={editor.isActive("bulletList")}
                            title="Elenco">
                            <List size={16} />
                        </ToolbarBtn>
                        <ToolbarBtn
                            onClick={() =>
                                editor
                                    .chain()
                                    .focus()
                                    .insertTable({
                                        rows: 3,
                                        cols: 3,
                                        withHeaderRow: true,
                                    })
                                    .run()
                            }
                            title="Tabella">
                            <TableIcon size={16} />
                        </ToolbarBtn>
                        <ToolbarBtn
                            onClick={triggerImageUpload}
                            title="Inserisci Immagini">
                            <ImageIcon size={16} />
                        </ToolbarBtn>
                    </div>

                    {/* Azione Salva */}
                    <button
                        type="button"
                        onClick={() => {
                            onSaveRequested?.();
                            setIsSavingFlash(true);
                            setTimeout(() => setIsSavingFlash(false), 500);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm
                        ${
                            isSavingFlash
                                ? "bg-green-500 text-white scale-105 shadow-lg shadow-green-200"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}>
                        <Save size={14} />{" "}
                        <span className="hidden md:inline uppercase tracking-widest">
                            Salva
                        </span>
                    </button>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="hidden sm:flex items-center bg-slate-100/50 p-0.5 rounded-lg">
                        <ToolbarBtn
                            onClick={() => editor.chain().focus().undo().run()}
                            title="Undo">
                            <Undo size={14} />
                        </ToolbarBtn>
                        <ToolbarBtn
                            onClick={() => editor.chain().focus().redo().run()}
                            title="Redo">
                            <Redo size={14} />
                        </ToolbarBtn>
                    </div>
                    <button
                        type="button"
                        onClick={toggleFullScreen}
                        className={`p-2 rounded-lg transition-all ${
                            isFullScreen
                                ? "bg-slate-800 text-white"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200"
                        }`}>
                        {isFullScreen ? (
                            <Minimize size={18} />
                        ) : (
                            <Maximize size={18} />
                        )}
                    </button>
                </div>
            </div>

            <div
                className={`overflow-y-auto flex-1 bg-slate-50/30 ${
                    isFullScreen ? "p-4 sm:p-12" : ""
                }`}>
                <div
                    className={`mx-auto bg-white transition-all duration-500 ${
                        isFullScreen
                            ? "w-full max-w-5xl min-h-full shadow-2xl rounded-2xl border border-slate-100 p-8"
                            : "w-full h-full"
                    }`}>
                    <EditorContent editor={editor} />
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                accept="image/*"
                multiple
                className="hidden"
            />

            <style
                jsx
                global>{`
                div:fullscreen {
                    background: #f8fafc !important;
                }
                .prose p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #cbd5e1;
                    pointer-events: none;
                    height: 0;
                }
                .prose img {
                    margin-left: auto;
                    margin-right: auto;
                    display: block;
                }
                .hljs-comment,
                .hljs-quote {
                    color: #6a737d;
                    font-style: italic;
                }
                .hljs-keyword,
                .hljs-selector-tag {
                    color: #d73a49;
                    font-weight: bold;
                }
                .hljs-string,
                .hljs-regexp {
                    color: #032f62;
                }
                .hljs-number,
                .hljs-literal {
                    color: #005cc5;
                }
                .hljs-type,
                .hljs-built_in {
                    color: #e36209;
                }
                .hljs-function,
                .hljs-title {
                    color: #6f42c1;
                }
                .hljs-params,
                .hljs-attr {
                    color: #005cc5;
                }
            `}</style>
        </div>
    );
}