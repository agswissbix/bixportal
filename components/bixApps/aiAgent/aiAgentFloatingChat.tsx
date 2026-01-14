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

export default function AiAgentFloatingChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Assicuriamoci che il componente sia montato sul client
    useEffect(() => {
        setMounted(true);
    }, []);

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
    }, [messages, isLoading, isOpen]);

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

    if (!mounted) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans pointer-events-none">
            <Toaster
                richColors
                position="top-right"
            />

            <div className="pointer-events-auto">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{
                                opacity: 0,
                                y: 20,
                                scale: 0.95,
                                transformOrigin: "bottom right",
                            }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="mb-4 w-[90vw] md:w-[420px] h-[70vh] md:h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
                            <header className="flex-none px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-900 rounded-lg">
                                        <Icons.SparklesIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-sm font-black text-slate-900 uppercase">
                                            BixAI Agent
                                        </h1>
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    systemStatus.status
                                                        ? "bg-emerald-500 animate-pulse"
                                                        : "bg-red-500"
                                                }`}></span>
                                            <span className="text-[10px] font-bold uppercase text-slate-400">
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
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors">
                                    <Icons.XMarkIcon className="w-6 h-6" />
                                </button>
                            </header>

                            <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#FDFDFD] p-6">
                                {messages.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{
                                            opacity: 0,
                                            x: msg.role === "user" ? 10 : -10,
                                        }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`mb-6 flex gap-3 ${
                                            msg.role === "user"
                                                ? "flex-row-reverse"
                                                : "flex-row"
                                        }`}>
                                        <div
                                            className={`flex-none w-8 h-8 rounded-lg flex items-center justify-center text-[8px] font-black border ${
                                                msg.role === "user"
                                                    ? "bg-white border-slate-200 text-slate-400"
                                                    : "bg-emerald-600 border-emerald-500 text-white"
                                            }`}>
                                            {msg.role === "user" ? (
                                                <Icons.UserIcon className="w-4 h-4" />
                                            ) : (
                                                "BIX"
                                            )}
                                        </div>
                                        <div
                                            className={`max-w-[85%] ${
                                                msg.role === "user"
                                                    ? "text-right"
                                                    : "text-left"
                                            }`}>
                                            <div
                                                className={`p-3 rounded-2xl text-sm ${
                                                    msg.role === "user"
                                                        ? "bg-emerald-50 text-slate-700 rounded-tr-none"
                                                        : "bg-slate-100 text-slate-800 rounded-tl-none"
                                                }`}>
                                                <div className="prose prose-sm max-w-none">
                                                    <ReactMarkdown
                                                        remarkPlugins={[
                                                            remarkGfm,
                                                        ]}
                                                        components={{
                                                            strong: ({
                                                                children,
                                                            }) => (
                                                                <strong
                                                                    className={`${
                                                                        children ===
                                                                        "offline"
                                                                            ? "text-red-500"
                                                                            : children ===
                                                                              "online"
                                                                            ? "text-emerald-600"
                                                                            : ""
                                                                    } font-black`}>
                                                                    {children}
                                                                </strong>
                                                            ),
                                                        }}>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-1 py-2">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    </div>
                                )}
                                <div
                                    ref={scrollRef}
                                    className="h-2"
                                />
                            </main>

                            <footer className="flex-none p-4 bg-white border-t border-slate-100">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSendMessage(input);
                                    }}
                                    className="relative flex items-end gap-2">
                                    <textarea
                                        ref={textareaRef}
                                        rows={1}
                                        value={input}
                                        onChange={(e) =>
                                            setInput(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" &&
                                                !e.shiftKey
                                            ) {
                                                e.preventDefault();
                                                handleSendMessage(input);
                                            }
                                        }}
                                        placeholder={
                                            systemStatus.status
                                                ? "Scrivi..."
                                                : "Offline"
                                        }
                                        disabled={
                                            isLoading || !systemStatus.status
                                        }
                                        className="w-full min-h-[44px] max-h-[120px] py-2.5 pl-4 pr-10 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all text-sm resize-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={
                                            !input.trim() ||
                                            isLoading ||
                                            !systemStatus.status
                                        }
                                        className="absolute right-1.5 bottom-1.5 h-8 w-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center disabled:opacity-50">
                                        <Icons.PaperAirplaneIcon className="w-4 h-4" />
                                    </button>
                                </form>
                            </footer>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`h-14 w-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all ${
                        isOpen
                            ? "bg-slate-900 text-white"
                            : "bg-emerald-600 text-white"
                    }`}>
                    {isOpen ? (
                        <Icons.ChevronDownIcon className="w-7 h-7" />
                    ) : (
                        <Icons.ChatBubbleLeftEllipsisIcon className="w-7 h-7" />
                    )}
                </motion.button>
            </div>

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
            `}</style>
        </div>
    );
}
