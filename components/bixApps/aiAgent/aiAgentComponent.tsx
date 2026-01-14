"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { useApi } from "@/utils/useApi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import * as Icons from "@heroicons/react/24/outline";

const isDev = false;

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface StatusResponse {
    status: boolean;
}

export default function AiAgentChatComponent() {
    // --- LOGICA STATUS ---
    const [systemStatus, setSystemStatus] = useState<StatusResponse>(
        isDev ? { status: true } : { status: false }
    );

    const statusPayload = useMemo(
        () => ({ apiRoute: "check_ai_chat_status" }),
        []
    );
    const { response: statusRes, loading: statusLoading } = !isDev
        ? useApi<StatusResponse>(statusPayload)
        : { response: null, loading: false };

    // --- LOGICA CHAT ---
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Inizializzazione sistemi **BixAI** in corso...",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const suggestions = ["Analizza log", "Stato infrastruttura", "Supporto AI"];

    // Sincronizza il messaggio iniziale con lo stato reale e i colori
    useEffect(() => {
        if (!statusLoading) {
            const isOnline = isDev || (statusRes && statusRes.status);
            setSystemStatus({ status: isOnline });

            setMessages((prev) => {
                if (prev.length === 1) {
                    return [
                        {
                            role: "assistant",
                            content: isOnline
                                ? "Sistemi **BixAI** **online**. Sono pronto ad assisterti. Come posso aiutarti?"
                                : "Sistemi **BixAI** **offline**. Al momento non è possibile stabilire una connessione con il server.",
                            timestamp: new Date(),
                        },
                    ];
                }
                return prev;
            });
        }
    }, [statusRes, statusLoading]);

    // Auto-resize della textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (queryText: string) => {
        if (!queryText.trim() || isLoading) return;
        if (!systemStatus.status && !isDev) {
            toast.error("SISTEMA OFFLINE");
            return;
        }

        const userQuery = queryText.trim();
        setInput("");
        setIsLoading(true);

        const userMsg: Message = {
            role: "user",
            content: userQuery,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);

        try {
            const response = await axiosInstanceClient.post(
                "/postApi",
                {
                    apiRoute: "ask_ai",
                    question: userQuery,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.status === "completed") {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: response.data.answer,
                        timestamp: response.data.timestamp
                            ? new Date(response.data.timestamp)
                            : new Date(),
                    },
                ]);
            }
        } catch (err) {
            toast.error("Errore di connessione");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiato");
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-white text-slate-900 font-sans overflow-hidden">
            <Toaster
                richColors
                position="top-right"
            />

            {/* HEADER */}
            <header className="flex-none px-4 md:px-10 py-3 md:py-5 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-sm z-30">
                <div className="flex items-center gap-3 md:gap-5">
                    <div className="p-2 md:p-2.5 bg-slate-900 rounded-xl shadow-sm">
                        <Icons.SparklesIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xs md:text-xl font-black text-slate-900 tracking-tight uppercase">
                            Agente BixAI
                        </h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    systemStatus.status
                                        ? "bg-emerald-500 animate-pulse"
                                        : "bg-red-500"
                                }`}></span>
                            <span
                                className={`text-[10px] md:text-sm font-bold uppercase tracking-widest ${
                                    systemStatus.status
                                        ? "text-slate-400"
                                        : "text-red-500"
                                }`}>
                                {statusLoading
                                    ? "..."
                                    : systemStatus.status
                                    ? "Online"
                                    : "Offline"}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setMessages([messages[0]])}
                    className="p-2 text-slate-300 hover:text-red-500 transition-all">
                    <Icons.TrashIcon className="w-6 h-6 md:w-7 md:h-7" />
                </button>
            </header>

            {/* CHAT AREA */}
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#FDFDFD]">
                <div className="max-w-4xl mx-auto px-4 md:px-10 py-6 md:py-12">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mb-8 md:mb-16 flex gap-3 md:gap-8 ${
                                    msg.role === "user"
                                        ? "flex-row-reverse"
                                        : "flex-row"
                                }`}>
                                <div
                                    className={`flex-none w-9 h-9 md:w-14 md:h-14 rounded-xl md:rounded-[1.2rem] flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                                        msg.role === "user"
                                            ? "bg-white border-slate-200 text-slate-400"
                                            : "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-100"
                                    }`}>
                                    {msg.role === "user" ? (
                                        <Icons.UserIcon className="w-5 h-5 md:w-6 md:h-6" />
                                    ) : (
                                        "BIX"
                                    )}
                                </div>

                                <div
                                    className={`flex flex-col ${
                                        msg.role === "user"
                                            ? "items-end text-right"
                                            : "items-start"
                                    } max-w-[85%] md:max-w-[80%]`}>
                                    <div className="flex items-center gap-2 mb-1.5 text-[9px] md:text-sm font-bold text-slate-400 uppercase tracking-[0.1em]">
                                        <span>
                                            {msg.role === "user"
                                                ? "Tu"
                                                : "BixAI"}
                                        </span>
                                        <span className="h-0.5 w-0.5 bg-slate-200 rounded-full"></span>
                                        <span>
                                            {msg.timestamp.toLocaleTimeString(
                                                [],
                                                {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }
                                            )}
                                        </span>
                                    </div>

                                    <div
                                        className={`relative group p-4 md:p-7 rounded-2xl md:rounded-[2rem] text-sm md:text-xl leading-relaxed ${
                                            msg.role === "user"
                                                ? "bg-white border border-slate-200 text-slate-700 rounded-tr-none"
                                                : "bg-slate-50 text-slate-800 rounded-tl-none"
                                        }`}>
                                        <div className="prose prose-sm md:prose-xl max-w-none prose-slate">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    // Logica per colorare parole specifiche se in grassetto
                                                    strong: ({
                                                        node,
                                                        children,
                                                        ...props
                                                    }) => {
                                                        const isOffline =
                                                            children ===
                                                            "offline";
                                                        const isOnline =
                                                            children ===
                                                            "online";
                                                        return (
                                                            <strong
                                                                className={`${
                                                                    isOffline
                                                                        ? "text-red-500"
                                                                        : isOnline
                                                                        ? "text-emerald-600"
                                                                        : ""
                                                                } font-black`}
                                                                {...props}>
                                                                {children}
                                                            </strong>
                                                        );
                                                    },
                                                }}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>

                                        {msg.role === "assistant" && (
                                            <button
                                                onClick={() =>
                                                    copyToClipboard(msg.content)
                                                }
                                                className="absolute -bottom-8 left-0 p-2 text-slate-300 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 text-[10px] font-bold uppercase">
                                                <Icons.DocumentDuplicateIcon className="w-3 h-3 md:w-4 md:h-4" />{" "}
                                                Copia
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isLoading && (
                        <div className="flex items-center gap-3 py-4">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                </div>
                <div
                    ref={scrollRef}
                    className="h-10"
                />
            </main>

            {/* FOOTER */}
            <footer className="flex-none p-3 md:p-10 bg-white border-t border-slate-100 shadow-xl">
                <div className="max-w-4xl mx-auto">
                    {!isLoading &&
                        messages.length < 3 &&
                        systemStatus.status && (
                            <div className="flex gap-2 mb-3 md:mb-6 overflow-x-auto no-scrollbar pb-1">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSendMessage(s)}
                                        className="whitespace-nowrap px-4 py-2 bg-slate-50 text-[10px] md:text-sm font-bold text-slate-500 rounded-xl border border-slate-100 transition-all">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage(input);
                        }}
                        className="relative flex items-end gap-2">
                        <div className="relative flex-1">
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(input);
                                    }
                                }}
                                placeholder={
                                    statusLoading
                                        ? "In attesa..."
                                        : systemStatus.status || isDev
                                        ? "Messaggio..."
                                        : "Sistema Offline"
                                }
                                disabled={
                                    isLoading ||
                                    statusLoading ||
                                    (!systemStatus.status && !isDev)
                                }
                                className="w-full min-h-[48px] md:min-h-[64px] max-h-[150px] py-3 md:py-4 pl-4 md:pl-6 pr-12 bg-slate-100/50 border border-slate-100 rounded-2xl md:rounded-[1.8rem] outline-none focus:bg-white focus:border-emerald-500 transition-all text-sm md:text-xl font-medium placeholder:text-slate-400 disabled:opacity-50 resize-none"
                            />
                            <button
                                type="submit"
                                disabled={
                                    !input.trim() ||
                                    isLoading ||
                                    statusLoading ||
                                    (!systemStatus.status && !isDev)
                                }
                                className="absolute right-2 bottom-2 h-8 w-8 md:h-12 md:w-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 disabled:bg-slate-200 transition-all">
                                <Icons.PaperAirplaneIcon className="w-4 h-4 md:w-6 md:h-6" />
                            </button>
                        </div>
                    </form>

                    <div className="mt-3 md:mt-6 flex justify-between items-center text-[8px] md:text-xs font-bold text-slate-300 uppercase tracking-widest px-2">
                        <span>BixAI Intelligence Unit</span>
                        <span>© {new Date().getFullYear()} BixData</span>
                    </div>
                </div>
            </footer>

            <style
                jsx
                global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }

                .prose pre {
                    background: #0f172a !important;
                    padding: 1rem !important;
                    border-radius: 1rem !important;
                    font-size: 0.85rem !important;
                }
                @media (min-width: 768px) {
                    .prose pre {
                        font-size: 1.1rem !important;
                        padding: 2rem !important;
                    }
                }
            `}</style>
        </div>
    );
}
