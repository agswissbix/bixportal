"use client";

import React, {
    useMemo,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "../genericComponent";
import { AppContext } from "@/context/appContext";

// --- TIPTAP CORE & UI COMPONENTS ---
import {
    useEditor,
    EditorContent,
    ReactNodeViewRenderer,
    NodeViewWrapper,
    NodeViewContent,
    mergeAttributes,
    ReactRenderer,  
} from "@tiptap/react";

import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";

import { StarterKit } from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Link } from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Highlight } from "@tiptap/extension-highlight";
import { Underline } from "@tiptap/extension-underline";
import Paragraph from "@tiptap/extension-paragraph";
import Heading from "@tiptap/extension-heading";
import TextAlign from "@tiptap/extension-text-align";;

// --- ESTENSIONI LOGICHE ---
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Typography } from "@tiptap/extension-typography";
import BubbleMenuExtension from "@tiptap/extension-bubble-menu";
import FloatingMenuExtension from "@tiptap/extension-floating-menu";
import Gapcursor from "@tiptap/extension-gapcursor";
import Dropcursor from "@tiptap/extension-dropcursor";
import CharacterCount from "@tiptap/extension-character-count";
import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import tippy from "tippy.js";

// --- TABELLE ---
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

// --- CODICE ---
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

// --- ICONE ---
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Table as TableIcon,
    Plus,
    Trash2,
    BetweenVerticalEnd, 
    BetweenHorizontalEnd, 
    Split, 
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Heading6,
    Maximize,
    Minimize,
    Save,
    Code as CodeIcon,
    Terminal,
    Link as LinkIcon,
    Check,
    Copy,
    Image as ImageIcon,
    FileDown,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    CheckSquare,
    CloudUpload,
    Undo,
    Redo,
    Highlighter as HighlightIcon,
    LayoutList,
    Highlighter,
    QuoteIcon as Quote,
    MinusIcon as Minus,
    UnderlineIcon,
} from "lucide-react";
import { uploadImageService } from "@/utils/mediaUploadService";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// --- TYPES ---
declare module "@tiptap/core" {
    interface EditorStorage {
        markdown: { getMarkdown(): string };
    }
}

const lowlight = createLowlight(common);

// --- 1. COMPONENTE IMMAGINE ---
const ResizableImageComponent = ({ node, updateAttributes, selected }: any) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleResize = (event: React.MouseEvent) => {
        event.preventDefault();
        const startX = event.pageX;
        const startWidth = containerRef.current?.offsetWidth || 0;

        const onMouseMove = (e: MouseEvent) => {
            const currentWidth = Math.max(100, startWidth + (e.pageX - startX));
            updateAttributes({ width: `${currentWidth}px` });
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    const align = node.attrs.align || "center";
    const alignmentClass =
        align === "left"
            ? "justify-start"
            : align === "right"
            ? "justify-end"
            : "justify-center";

    return (
        <NodeViewWrapper
            className={`relative my-8 flex w-full ${alignmentClass}`}>
            <div
                ref={containerRef}
                style={{ width: node.attrs.width || "auto", maxWidth: "100%" }}
                className={`relative group transition-all ${
                    selected ? "ring-4 ring-blue-500/30 rounded-xl" : ""
                }`}>
                {selected && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg shadow-xl no-print">
                        <button
                            type="button"
                            onClick={() => updateAttributes({ align: "left" })}
                            className={`p-1.5 rounded ${
                                align === "left"
                                    ? "bg-slate-100 text-blue-600"
                                    : "hover:bg-slate-50 text-slate-500"
                            }`}>
                            <AlignLeft size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                updateAttributes({ align: "center" })
                            }
                            className={`p-1.5 rounded ${
                                align === "center"
                                    ? "bg-slate-100 text-blue-600"
                                    : "hover:bg-slate-50 text-slate-500"
                            }`}>
                            <AlignCenter size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => updateAttributes({ align: "right" })}
                            className={`p-1.5 rounded ${
                                align === "right"
                                    ? "bg-slate-100 text-blue-600"
                                    : "hover:bg-slate-50 text-slate-500"
                            }`}>
                            <AlignRight size={16} />
                        </button>
                    </div>
                )}
                <img
                    src={node.attrs.src}
                    alt={node.attrs.alt}
                    className="rounded-xl w-full h-auto block border border-slate-100 shadow-sm pointer-events-none"
                />
                {selected && (
                    <div
                        onMouseDown={handleResize}
                        className="absolute bottom-3 right-3 w-6 h-6 bg-blue-600 rounded-full cursor-nwse-resize border-2 border-white shadow-lg z-30 hover:scale-110 transition-transform"
                    />
                )}
            </div>
        </NodeViewWrapper>
    );
};

// --- 2. COMPONENTE CODE BLOCK CON COPIA ---
const CodeBlockComponent = ({ node, editor, getPos }: any) => {
    const [copied, setCopied] = useState(false);
    return (
        <NodeViewWrapper className="relative group my-8">
            <div className="absolute right-4 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    type="button"
                    onClick={() => {
                        const text = editor.state.doc.nodeAt(
                            getPos()
                        ).textContent;
                        navigator.clipboard.writeText(text);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                        toast.success("Copiato!");
                    }}
                    className="p-2 bg-white border rounded-md shadow-md text-slate-700">
                    {copied ? (
                        <Check
                            size={14}
                            className="text-green-600"
                        />
                    ) : (
                        <Copy size={14} />
                    )}
                </button>
            </div>
            <pre className="rounded-xl border border-slate-200 bg-[#f6f8fa] p-6 font-mono text-[14px] leading-relaxed overflow-x-auto shadow-inner">
                <NodeViewContent
                    as={"code" as any}
                    className="hljs"
                    style={{ color: "#1f2328" }}
                />
            </pre>
        </NodeViewWrapper>
    );
};

interface PropsInterface {
    initialValue?: string;
    onChange?: (val: string) => void;
    onSaveRequested?: () => void;
    recordId?: string;
}
interface ResponseInterface {
    markdownContent: string;
}

const CustomParagraph = Paragraph.extend({
    addStorage() {
        return {
            markdown: {
                serialize(state, node) {
                    if (
                        node.attrs.textAlign &&
                        node.attrs.textAlign !== "left"
                    ) {
                        state.write(
                            `<p style="text-align: ${node.attrs.textAlign}">`
                        );
                        state.renderInline(node);
                        state.write(`</p>`);
                        state.closeBlock(node);
                    } else {
                        state.renderInline(node);
                        state.closeBlock(node);
                    }
                },
            },
        };
    },
});

const CustomHeading = Heading.extend({
    addStorage() {
        return {
            markdown: {
                serialize(state, node) {
                    if (
                        node.attrs.textAlign &&
                        node.attrs.textAlign !== "left"
                    ) {
                        state.write(
                            `<h${node.attrs.level} style="text-align: ${node.attrs.textAlign}">`
                        );
                        state.renderInline(node);
                        state.write(`</h${node.attrs.level}>`);
                        state.closeBlock(node);
                    } else {
                        state.write(state.repeat("#", node.attrs.level) + " ");
                        state.renderInline(node);
                        state.closeBlock(node);
                    }
                },
            },
        };
    },
});

// --- LOGICA SUGGESTION ---
const Commands = Extension.create({
    name: "mention",
    addOptions() {
        return {
            suggestion: {
                char: "/",
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            },
        };
    },
    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

// --- LISTA DEI COMANDI ---
const getSuggestionItems = ({ query }: { query: string }) => {
    return [
        {
            title: "Titolo 1",
            description: "Titolo grande",
            icon: <Heading1 size={18} />,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode("heading", { level: 1 })
                    .run();
            },
        },
        {
            title: "Titolo 2",
            description: "Titolo medio",
            icon: <Heading2 size={18} />,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode("heading", { level: 2 })
                    .run();
            },
        },
        {
            title: "Checklist",
            description: "Lista di attività",
            icon: <CheckSquare size={18} />,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleTaskList()
                    .run();
            },
        },
        {
            title: "Tabella",
            description: "Inserisci una griglia",
            icon: <TableIcon size={18} />,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run();
            },
        },
        {
            title: "Blocco Codice",
            description: "Codice con evidenziazione",
            icon: <Terminal size={18} />,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleCodeBlock()
                    .run();
            },
        },
    ]
        .filter((item) =>
            item.title.toLowerCase().startsWith(query.toLowerCase())
        )
        .slice(0, 10);
};

const CommandList = React.forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    React.useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: any) => {
            if (event.key === "ArrowUp") {
                setSelectedIndex(
                    (selectedIndex + props.items.length - 1) %
                        props.items.length
                );
                return true;
            }
            if (event.key === "ArrowDown") {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }
            if (event.key === "Enter") {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    return (
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col min-w-[200px] p-1">
            {props.items.length ? (
                props.items.map((item: any, index: number) => (
                    <button
                        key={index}
                        onClick={() => selectItem(index)}
                        className={`flex items-center gap-3 px-3 py-2 text-left text-sm rounded-md transition-colors ${
                            index === selectedIndex
                                ? "bg-blue-50 text-blue-700"
                                : "hover:bg-slate-50 text-slate-700"
                        }`}>
                        <div
                            className={`p-1.5 rounded border ${
                                index === selectedIndex
                                    ? "bg-white border-blue-200"
                                    : "bg-slate-50"
                            }`}>
                            {item.icon}
                        </div>
                        <div>
                            <div className="font-bold leading-none mb-1">
                                {item.title}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-tight">
                                {item.description}
                            </div>
                        </div>
                    </button>
                ))
            ) : (
                <div className="px-3 py-2 text-slate-400 text-sm italic">
                    Nessun comando...
                </div>
            )}
        </div>
    );
});
CommandList.displayName = "CommandList";

export default function inputMarkdown({
    initialValue,
    onChange,
    onSaveRequested,
    recordId,
}: PropsInterface) {
    const { user } = useContext(AppContext);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isSavingFlash, setIsSavingFlash] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isAutosaving, setIsAutosaving] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastValueRef = useRef(initialValue || "");

    const [tocItems, setTocItems] = useState<
        { level: number; text: string; pos: number }[]
    >([]);

    // --- GESTIONE DATI ---
    const isDev = true;
    const responseDataDEFAULT = { markdownContent: initialValue || "" };
    const responseDataDEV = {
        markdownContent: initialValue || "# Editor Markdown",
    };
    const [responseData, setResponseData] = useState<ResponseInterface>(
        isDev ? responseDataDEV : responseDataDEFAULT
    );

    const payload = useMemo(
        () =>
            isDev || !recordId
                ? null
                : { apiRoute: "get_markdown_content", recordId },
        [recordId, isDev]
    );

    const apiResult = useApi<ResponseInterface>(
        payload || { apiRoute: "", recordId: "" }
    );

    const { response, loading, error } = payload
        ? apiResult
        : { response: null, loading: false, error: null };

    useEffect(() => {
        if (response) setResponseData(response);
    }, [response]);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: false,
                paragraph: false,
                codeBlock: false,
            }),
            CustomParagraph,
            CustomHeading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
                alignments: ["left", "center", "right", "justify"],
                defaultAlignment: "left",
            }),
            Markdown.configure({
                html: true,
                tightLists: true,
                bulletListMarker: "-",
                linkify: true,
            }),
            Typography,
            Underline,
            Highlight.configure({ multicolor: true }),
            TaskList,
            TaskItem.configure({
                nested: true,
                HTMLAttributes: {
                    class: "task-item-row",
                },
            }),
            BubbleMenuExtension.configure({ element: null }),
            FloatingMenuExtension.configure({ element: null }),
            CodeBlockLowlight.extend({
                addNodeView() {
                    return ReactNodeViewRenderer(CodeBlockComponent);
                },
            }).configure({ lowlight }),
            Table.configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
            Placeholder.configure({
                placeholder: "Inizia a scrivere o usa '/' per i comandi...",
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-600 underline cursor-pointer",
                },
            }),
            Gapcursor,
            Dropcursor.configure({
                color: "#3b82f6",
                width: 2,
            }),
            CharacterCount.configure({
                limit: 10000,
            }),
            Image.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        width: {
                            default: "100%",
                            parseHTML: (element) =>
                                element.getAttribute("width") ||
                                element.style.width,
                            renderHTML: (attributes) => ({
                                width: attributes.width,
                            }),
                        },
                        align: {
                            default: "center",
                            parseHTML: (element) =>
                                element.getAttribute("data-align") || "center",
                            renderHTML: (attributes) => ({
                                "data-align": attributes.align,
                            }),
                        },
                    };
                },
                addStorage() {
                    return {
                        markdown: {
                            serialize(state: any, node: any) {
                                const { src, alt, width, align } = node.attrs;
                                const margin =
                                    align === "left"
                                        ? "0 auto 0 0"
                                        : align === "right"
                                        ? "0 0 0 auto"
                                        : "0 auto";

                                state.write(
                                    `<img src="${src}" alt="${
                                        alt || ""
                                    }" width="${width}" data-align="${align}" style="display: block; margin: ${margin}; width: ${width};">`
                                );
                                state.closeBlock(node);
                            },
                            parse: {
                                // Il parsing viene gestito automaticamente da parseHTML se html: true è attivo
                            },
                        },
                    };
                },
                renderHTML({ HTMLAttributes }) {
                    const align = HTMLAttributes["data-align"];
                    const margin =
                        align === "left"
                            ? "0 auto 0 0"
                            : align === "right"
                            ? "0 0 0 auto"
                            : "0 auto";

                    return [
                        "img",
                        mergeAttributes(
                            this.options.HTMLAttributes,
                            HTMLAttributes,
                            {
                                style: `display: block; margin: ${margin}; width: ${HTMLAttributes.width}; height: auto;`,
                            }
                        ),
                    ];
                },
                addNodeView() {
                    return ReactNodeViewRenderer(ResizableImageComponent);
                },
            }).configure({ allowBase64: false }),
            Commands.configure({
                suggestion: {
                    items: getSuggestionItems,
                    render: () => {
                        let component: any;
                        let popup: any;

                        return {
                            onStart: (props: any) => {
                                component = new ReactRenderer(CommandList, {
                                    props,
                                    editor: props.editor,
                                });

                                popup = tippy("body", {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: "manual",
                                    placement: "bottom-start",
                                });
                            },
                            onUpdate(props: any) {
                                component.updateProps(props);
                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect,
                                });
                            },
                            onKeyDown(props: any) {
                                if (props.event.key === "Escape") {
                                    popup[0].hide();
                                    return true;
                                }
                                return component.ref?.onKeyDown(props);
                            },
                            onExit() {
                                popup[0].destroy();
                                component.destroy();
                            },
                        };
                    },
                },
            }),
        ],
        content: responseData.markdownContent,
        onUpdate: ({ editor }) => {
            const markdown = (editor.storage as any).markdown.getMarkdown();
            lastValueRef.current = markdown;
            setResponseData((prev) => ({ ...prev, markdownContent: markdown }));
            updateToc(editor);
            if (onChange) onChange(markdown);
        },
        onCreate: ({ editor }) => {
            updateToc(editor);
        },
        editorProps: {
            attributes: {
                class: "focus:outline-none min-h-[500px] p-10 sm:p-16 bg-white prose prose-slate max-w-none selection:bg-blue-100",
            },
            handleDrop: (view, event, slice, moved) => {
                if (
                    !moved &&
                    event.dataTransfer &&
                    event.dataTransfer.files &&
                    event.dataTransfer.files[0]
                ) {
                    const files = Array.from(event.dataTransfer.files);
                    const images = files.filter((file) =>
                        /image/i.test(file.type)
                    );

                    if (images.length > 0) {
                        event.preventDefault();

                        const coordinates = view.posAtCoords({
                            left: event.clientX,
                            top: event.clientY,
                        });

                        const insertionPos =
                            coordinates?.pos ?? view.state.doc.content.size;

                        images.forEach((image) => {
                            handleImageUpload(image, insertionPos);
                        });
                        return true;
                    }
                }
                return false;
            },
            handlePaste: (view, event) => {
                if (
                    event.clipboardData &&
                    event.clipboardData.files &&
                    event.clipboardData.files[0]
                ) {
                    const files = Array.from(event.clipboardData.files);
                    const images = files.filter((file) =>
                        /image/i.test(file.type)
                    );

                    if (images.length > 0) {
                        event.preventDefault();
                        images.forEach((image) => {
                            handleImageUpload(image);
                        });
                        return true;
                    }
                }
                return false;
            },
            handleKeyDown: (view, event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "s") {
                    event.preventDefault();
                    setIsSavingFlash(true);
                    onSaveRequested?.();
                    setTimeout(() => setIsSavingFlash(false), 500);
                    return true;
                }
                return false;
            },
        },
    });

    // --- AUTOSAVE ---
    useEffect(() => {
        if (!editor || isDev) return;
        const timer = setTimeout(() => {
            if (lastValueRef.current !== initialValue) {
                setIsAutosaving(true);
                onSaveRequested?.();
                setTimeout(() => setIsAutosaving(false), 1000);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [lastValueRef.current, onSaveRequested, initialValue, isDev]);

    const handleImageUpload = useCallback(
        async (file: File, pos?: number) => {
            if (!editor) return;

            const url = await uploadImageService(file);
            if (url) {
                const content = {
                    type: "image",
                    attrs: {
                        src: url,
                        width: "100%",
                        align: "center",
                    },
                };

                if (pos !== undefined) {
                    editor.chain().insertContentAt(pos, content).focus().run();
                } else {
                    editor.chain().focus().insertContent(content).run();
                }

                const markdown = (editor.storage as any).markdown.getMarkdown();
                lastValueRef.current = markdown;
                if (onChange) onChange(markdown);
            }
        },
        [editor, onChange]
    );

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("Inserisci URL:", previousUrl);
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
    }, [editor]);

    const handleExportPDF = async () => {
        if (!printRef.current || !editor) return;
        setIsExporting(true);
        try {
            const html2pdfModule = await import("html2pdf.js");
            const html2pdf = (html2pdfModule as any).default || html2pdfModule;

            printRef.current.innerHTML = editor.getHTML();

            const opt = {
                margin: [15, 15, 15, 15],
                filename: `documento_${new Date().getTime()}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                pagebreak: { mode: ["avoid-all", "css", "legacy"] },
            };
            await html2pdf().set(opt).from(printRef.current).save();
            toast.success("PDF generato!");
        } catch (error) {
            toast.error("Errore esportazione PDF");
        } finally {
            setIsExporting(false);
        }
    };

    const toggleFullScreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current
                .requestFullscreen()
                .catch((err) => toast.error(`Errore FS: ${err.message}`));
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        setMounted(true);
        const handleFsChange = () =>
            setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handleFsChange);
        return () =>
            document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

    useEffect(() => {
        if (
            editor &&
            responseData.markdownContent !== undefined &&
            responseData.markdownContent !== lastValueRef.current &&
            !editor.isFocused
        ) {
            lastValueRef.current = responseData.markdownContent;
            editor.commands.setContent(responseData.markdownContent, {
                emitUpdate: false,
            });
            updateToc(editor);
        }
    }, [responseData.markdownContent, editor]);

    const updateToc = useCallback((editorInstance: any) => {
        const headings: any[] = [];
        editorInstance.state.doc.descendants((node: any, pos: number) => {
            if (node.type.name === "heading") {
                headings.push({
                    level: node.attrs.level,
                    text: node.textContent,
                    pos: pos,
                });
            }
        });
        setTocItems(headings);
    }, []);

    
    if (!editor || !mounted)
        return (
            <div className="h-[500px] bg-slate-50 animate-pulse rounded-xl" />
        );

    return (
        <GenericComponent
            response={responseData}
            loading={loading}
            error={error}>
            {(data: ResponseInterface) => (
                <div
                    ref={containerRef}
                    className={`flex flex-col bg-white overflow-hidden transition-all duration-300 ${
                        isFullScreen
                            ? "fixed inset-0 z-[9999] w-screen h-screen"
                            : "relative rounded-2xl border border-slate-200 shadow-lg"
                    }`}>
                    {/* TOP TOOLBAR */}
                    <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-white/95 backdrop-blur-md no-print">
                        <div className="flex items-center flex-wrap gap-1.5">
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl mr-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor.chain().focus().undo().run()
                                    }
                                    disabled={!editor.can().undo()}
                                    className="p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-30 rounded-lg">
                                    <Undo size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor.chain().focus().redo().run()
                                    }
                                    disabled={!editor.can().redo()}
                                    className="p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-30 rounded-lg">
                                    <Redo size={18} />
                                </button>
                            </div>
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleHeading({ level: 1 })
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("heading", { level: 1 })
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <Heading1 size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleHeading({ level: 2 })
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("heading", { level: 2 })
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <Heading2 size={18} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleHeading({ level: 3 })
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("heading", { level: 3 })
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <Heading3 size={18} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleHeading({ level: 4 })
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("heading", { level: 4 })
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <Heading4 size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleHeading({ level: 5 })
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("heading", { level: 5 })
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <Heading5 size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleHeading({ level: 6 })
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("heading", { level: 6 })
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <Heading6 size={18} />
                                </button>
                            </div>

                            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleBold()
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("bold")
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <Bold size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleItalic()
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("italic")
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <Italic size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleUnderline()
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("underline")
                                            ? "bg-slate-900 text-white"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <UnderlineIcon size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleHighlight()
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("highlight")
                                            ? "bg-yellow-400 text-black"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <HighlightIcon size={18} />
                                </button>
                                <button
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleBlockquote()
                                            .run()
                                    }>
                                    <Quote size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={setLink}
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("link")
                                            ? "bg-blue-600 text-white shadow-lg"
                                            : "text-slate-600 hover:bg-blue-50"
                                    }`}>
                                    <LinkIcon size={18} />
                                </button>
                            </div>

                            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .setTextAlign("left")
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive({ textAlign: "left" })
                                            ? "bg-white shadow-sm text-blue-600"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <AlignLeft size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .setTextAlign("center")
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive({ textAlign: "center" })
                                            ? "bg-white shadow-sm text-blue-600"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <AlignCenter size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .setTextAlign("right")
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive({ textAlign: "right" })
                                            ? "bg-white shadow-sm text-blue-600"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <AlignRight size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .setTextAlign("justify")
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive({
                                            textAlign: "justify",
                                        })
                                            ? "bg-white shadow-sm text-blue-600"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <AlignJustify size={18} />
                                </button>
                            </div>

                            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleTaskList()
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("taskList")
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}
                                    title="Checklist">
                                    <CheckSquare size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleBulletList()
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("bulletList")
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <List size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleOrderedList()
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("orderedList")
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    <ListOrdered size={18} />
                                </button>
                                <button
                                    type="button"
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
                                    className="p-2 hover:bg-slate-200 text-slate-600 rounded-lg">
                                    <TableIcon size={18} />
                                </button>
                                {editor.isActive("table") && (
                                    <>
                                        <div className="w-[1px] h-4 bg-slate-300 mx-1" />
                                        <button
                                            onClick={() =>
                                                editor
                                                    .chain()
                                                    .focus()
                                                    .addColumnAfter()
                                                    .run()
                                            }
                                            className="p-2 hover:bg-slate-200 text-blue-600 rounded-lg"
                                            title="Aggiungi Colonna">
                                            <BetweenVerticalEnd size={18} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                editor
                                                    .chain()
                                                    .focus()
                                                    .addRowAfter()
                                                    .run()
                                            }
                                            className="p-2 hover:bg-slate-200 text-blue-600 rounded-lg"
                                            title="Aggiungi Riga">
                                            <BetweenHorizontalEnd size={18} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                editor
                                                    .chain()
                                                    .focus()
                                                    .deleteColumn()
                                                    .run()
                                            }
                                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                                            title="Elimina Colonna">
                                            <Trash2 size={16} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                editor
                                                    .chain()
                                                    .focus()
                                                    .deleteRow()
                                                    .run()
                                            }
                                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                                            title="Elimina Riga">
                                            <Trash2
                                                size={16}
                                                className="rotate-90"
                                            />
                                        </button>
                                        <button
                                            onClick={() =>
                                                editor
                                                    .chain()
                                                    .focus()
                                                    .deleteTable()
                                                    .run()
                                            }
                                            className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
                                            title="Elimina Tabella">
                                            <TableIcon
                                                size={18}
                                                className="text-red-700"
                                            />
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        editor.chain().focus().run();
                                        fileInputRef.current?.click();
                                    }}
                                    className="p-2 hover:bg-slate-200 text-slate-600 rounded-lg">
                                    <ImageIcon size={18} />
                                </button>
                            </div>

                            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleCode()
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("code")
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}
                                    title="Codice Inline">
                                    <CodeIcon size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleCodeBlock()
                                            .run()
                                    }
                                    className={`p-2 rounded-lg ${
                                        editor.isActive("codeBlock")
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-slate-600 hover:bg-slate-200"
                                    }`}
                                    title="Blocco Codice">
                                    <Terminal size={18} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {isAutosaving && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 animate-pulse uppercase">
                                        <CloudUpload size={14} /> Autosave
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={handleExportPDF}
                                    disabled={isExporting}
                                    className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Esporta PDF">
                                    <FileDown
                                        size={20}
                                        className={
                                            isExporting ? "animate-bounce" : ""
                                        }
                                    />
                                </button>
                                {isFullScreen ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSaveRequested?.();
                                            setIsSavingFlash(true);
                                            setTimeout(
                                                () => setIsSavingFlash(false),
                                                500
                                            );
                                        }}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-md ${
                                            isSavingFlash
                                                ? "bg-green-600 text-white scale-105"
                                                : "bg-blue-600 text-white hover:bg-blue-700"
                                        }`}>
                                        <Save size={16} /> <span>SALVA</span>
                                    </button>
                                ) : null}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={toggleFullScreen}
                            className="p-3 rounded-xl bg-slate-100 border text-slate-500 hover:bg-slate-200">
                            {isFullScreen ? (
                                <Minimize size={20} />
                            ) : (
                                <Maximize size={20} />
                            )}
                        </button>
                    </div>

                    {/* BUBBLE & FLOATING MENU */}
                    <BubbleMenu
                        editor={editor}
                        className="flex bg-slate-900 text-white rounded-lg shadow-xl overflow-hidden border border-slate-700">
                        <button
                            type="button"
                            onClick={() =>
                                editor.chain().focus().toggleBold().run()
                            }
                            className={`p-2 hover:bg-slate-800 ${
                                editor.isActive("bold") ? "text-blue-400" : ""
                            }`}>
                            <Bold size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                editor.chain().focus().toggleItalic().run()
                            }
                            className={`p-2 hover:bg-slate-800 ${
                                editor.isActive("italic") ? "text-blue-400" : ""
                            }`}>
                            <Italic size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                editor.chain().focus().toggleCode().run()
                            }
                            className={`p-2 hover:bg-slate-800 ${
                                editor.isActive("code") ? "text-blue-400" : ""
                            }`}>
                            <CodeIcon size={14} />
                        </button>
                    </BubbleMenu>

                    <FloatingMenu
                        editor={editor}
                        className="flex gap-1 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5">
                        <button
                            type="button"
                            onClick={() =>
                                editor
                                    .chain()
                                    .focus()
                                    .toggleHeading({ level: 2 })
                                    .run()
                            }
                            className="p-2 hover:bg-slate-50 rounded-lg text-slate-600">
                            <Heading2 size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                editor.chain().focus().toggleBulletList().run()
                            }
                            className="p-2 hover:bg-slate-50 rounded-lg text-slate-600">
                            <List size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                editor.chain().focus().toggleOrderedList().run()
                            }
                            className="p-2 hover:bg-slate-50 rounded-lg text-slate-600">
                            <ListOrdered size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                editor.chain().focus().run();
                                fileInputRef.current?.click();
                            }}
                            className="p-2 hover:bg-slate-50 rounded-lg text-slate-600">
                            <ImageIcon size={16} />
                        </button>
                    </FloatingMenu>

                    <div className="flex flex-1 overflow-hidden relative">
                        {/* SIDEBAR INDICE */}
                        {isFullScreen && (
                            <aside className="w-64 border-r bg-slate-50/50 p-6 overflow-y-auto no-print">
                                <div className="flex items-center gap-2 mb-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                    <LayoutList size={14} /> Indice
                                </div>
                                <nav className="space-y-1">
                                    {tocItems.length > 0 ? (
                                        tocItems.map((item, i) => (
                                            <button
                                                key={i}
                                                onClick={() =>
                                                    editor.commands.focus(
                                                        item.pos
                                                    )
                                                }
                                                className={`block w-full text-left transition-all hover:text-blue-600 text-sm ${
                                                    item.level === 1
                                                        ? "font-bold text-slate-700"
                                                        : item.level === 2
                                                        ? "text-slate-500 ml-3"
                                                        : "text-slate-400 text-xs ml-6"
                                                }`}>
                                                {item.text}
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-300 italic">
                                            Nessun titolo
                                        </p>
                                    )}
                                </nav>
                            </aside>
                        )}

                        {/* AREA EDITING */}
                        <main
                            className={`flex-1 overflow-y-auto bg-[#fcfcfc] ${
                                isFullScreen ? "p-12" : ""
                            }`}>
                            <div
                                className={`mx-auto bg-white shadow-sm border border-slate-100 transition-all duration-300 ${
                                    isFullScreen
                                        ? "max-w-5xl min-h-full p-16"
                                        : "w-full min-h-full"
                                }`}>
                                <EditorContent editor={editor} />
                            </div>
                        </main>
                    </div>

                    <div className="flex items-center justify-between px-6 py-2 border-t bg-slate-50 text-[11px] font-medium text-slate-500 no-print">
                        <div className="flex items-center gap-4">
                            <span>
                                {editor.storage.characterCount.words()} PAROLE
                            </span>
                            <span>
                                {editor.storage.characterCount.characters()}{" "}
                                CARATTERI
                            </span>
                        </div>
                        <div className="uppercase tracking-wider">Markdown</div>
                    </div>

                    {/* AREA PDF NASCOSTA */}
                    <div
                        style={{
                            position: "absolute",
                            top: "-9999px",
                            left: "-9999px",
                            width: "210mm",
                        }}>
                        <div
                            ref={printRef}
                            className="p-12 bg-white prose prose-slate max-w-none prose-img:rounded-xl"></div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                Array.from(e.target.files).forEach((file) => {
                                    handleImageUpload(file);
                                });
                            }
                            e.target.value = "";
                        }}
                        accept="image/*"
                        multiple
                        className="hidden"
                    />

                    <style
                        jsx
                        global>{`
                        /* 1. LISTE STANDARD (Puntate e Numerate) */
                        .prose ul:not([data-type="taskList"]) {
                            list-style-type: disc !important;
                            padding-left: 1.5rem !important;
                            margin-bottom: 1rem;
                        }

                        .prose ol {
                            list-style-type: decimal !important;
                            padding-left: 1.5rem !important;
                            margin-bottom: 1rem;
                        }

                        /* Assicura che i numeri/pallini siano visibili e ben spaziati */
                        .prose ol > li,
                        .prose ul:not([data-type="taskList"]) > li {
                            padding-left: 0.5rem;
                            margin-bottom: 0.25rem;
                        }

                        /* 2. CHECKLIST (TaskList) */
                        .prose ul[data-type="taskList"] {
                            list-style: none !important;
                            padding: 0 !important;
                            margin: 1.5rem 0 !important;
                        }

                        .prose ul[data-type="taskList"] li {
                            display: flex;
                            align-items: flex-start;
                            gap: 0.75rem;
                            margin-bottom: 0.5rem;
                        }

                        /* Rimuove i pallini generati automaticamente da Tailwind nelle checklist */
                        .prose ul[data-type="taskList"] li::before {
                            content: none !important;
                            display: none !important;
                        }

                        /* Allineamento perfetto del checkbox con la riga di testo */
                        .prose ul[data-type="taskList"] input[type="checkbox"] {
                            appearance: checkbox !important;
                            width: 1.1rem;
                            height: 1.1rem;
                            cursor: pointer;
                            margin: 0;
                            margin-top: 0.35rem;
                            flex-shrink: 0;
                        }

                        /* Effetto sbiadito e barrato per task completate */
                        .prose
                            ul[data-type="taskList"]
                            li[data-checked="true"]
                            > div
                            > p {
                            text-decoration: line-through;
                            opacity: 0.5;
                        }

                        /* 3. IMMAGINI (Allineamento e Dimensioni) */
                        .prose img {
                            display: block;
                            max-width: 100%;
                            height: auto;
                            border-radius: 0.75rem;
                        }

                        .prose img[data-align="left"] {
                            margin: 0 auto 0 0;
                        }
                        .prose img[data-align="right"] {
                            margin: 0 0 0 auto;
                        }
                        .prose img[data-align="center"] {
                            margin: 0 auto;
                        }

                        /* 4. TESTO (Underline e Placeholder) */
                        .prose u,
                        u {
                            text-decoration: underline !important;
                            text-decoration-thickness: 1px !important;
                            text-underline-offset: 3px !important;
                            border-bottom: none !important;
                        }

                        .prose p.is-editor-empty:first-child::before {
                            content: attr(data-placeholder);
                            float: left;
                            color: #adb5bd;
                            pointer-events: none;
                            height: 0;
                        }

                        /* 5. CODICE (Inline e Syntax Highlighting) */
                        .prose :not(pre) > code {
                            color: #cf222e !important;
                            background-color: #f6f8fa !important;
                            padding: 0.2rem 0.4rem !important;
                            border-radius: 6px !important;
                            font-size: 0.85em !important;
                            border: 1px solid #d0d7de !important;
                            font-weight: 600 !important;
                        }

                        .prose code::before,
                        .prose code::after {
                            content: "" !important;
                        }

                        /* Colori HLJS per il blocco codice */
                        .hljs-comment {
                            color: #6a737d;
                        }
                        .hljs-keyword,
                        .hljs-selector-tag {
                            color: #cf222e;
                            font-weight: bold;
                        }
                        .hljs-string,
                        .hljs-regexp {
                            color: #0a3069;
                        }
                        .hljs-title,
                        .hljs-section {
                            color: #8250df;
                            font-weight: bold;
                        }
                        .hljs-number,
                        .hljs-literal {
                            color: #0550ae;
                        }
                        .hljs-attr {
                            color: #116329;
                        }
                        .hljs-params {
                            color: #24292e;
                        }

                        /* Stile per il Gapcursor (la linea per inserire blocchi) */
                        .ProseMirror .ProseMirror-gapcursor {
                            background: none;
                            border-left: 1px solid black;
                            cursor: text;
                            display: none;
                            position: absolute;
                        }

                        .ProseMirror .ProseMirror-gapcursor:after {
                            border-top: 2px solid #3b82f6;
                            content: "";
                            display: block;
                            position: absolute;
                            top: -2px;
                            width: 20px;
                        }

                        .ProseMirror-focused .ProseMirror-gapcursor {
                            display: block;
                        }

                        /* STILE TABELLE */
                        .prose table {
                            border-collapse: collapse;
                            table-layout: fixed;
                            width: 100%;
                            margin: 2rem 0;
                            overflow: hidden;
                        }

                        .prose table td,
                        .prose table th {
                            border: 1px solid #e2e8f0; /* slate-200 */
                            box-sizing: border-box;
                            min-width: 1em;
                            padding: 12px 15px;
                            position: relative;
                            vertical-align: top;
                            text-align: left;
                        }

                        .prose table th {
                            background-color: #f8fafc; /* slate-50 */
                            font-weight: bold;
                        }

                        /* Evidenzia la cella selezionata */
                        .prose table .selectedCell:after {
                            background: rgba(
                                59,
                                130,
                                246,
                                0.1
                            ); /* blue-500 con opacità */
                            content: "";
                            left: 0;
                            right: 0;
                            top: 0;
                            bottom: 0;
                            pointer-events: none;
                            position: absolute;
                            z-index: 2;
                        }

                        /* Gestione ridimensionamento colonne */
                        .prose .column-resize-handle {
                            background-color: #3b82f6;
                            bottom: -2px;
                            position: absolute;
                            right: -2px;
                            top: 0;
                            width: 4px;
                            z-index: 20;
                        }
                    `}</style>
                </div>
            )}
        </GenericComponent>
    );
}
