"use client";
import React, { useState, useEffect, useRef } from "react";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import * as Icons from "@heroicons/react/24/outline";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export default function AiAgentChatComponent() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content:
                "Benvenuto in **BixData Neural**. Il sistema è collegato alla Lenovo PGX. Come posso aiutarti?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll all'ultimo messaggio
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

        const userQuery = queryText.trim();
        setInput("");
        setIsLoading(true);

        // Aggiungi il messaggio dell'utente immediatamente
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
            } else {
                toast.error(response.data.message || "Errore dal server");
            }
        } catch (err: any) {
            console.error("Chat Error:", err);
            toast.error("Errore di connessione. Riprova più tardi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-[#F9FAFB] text-zinc-900 font-sans overflow-hidden">
            <Toaster
                richColors
                position="top-right"
            />

            {/* HEADER */}
            <header className="px-8 py-5 bg-white border-b border-zinc-200 flex items-center justify-between z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="p-2.5 bg-zinc-900 rounded-2xl shadow-xl">
                            <Icons.CpuChipIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-orange-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-tighter text-zinc-800 uppercase leading-none italic">
                            BixData Neural Agent
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">
                                Lenovo PGX Workstation
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setMessages([messages[0]])}
                    className="p-2.5 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-red-600 transition-all active:scale-95">
                    <Icons.TrashIcon className="w-5 h-5" />
                </button>
            </header>

            {/* CHAT AREA */}
            <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8 custom-scrollbar bg-gradient-to-b from-white to-[#F3F4F6]">
                <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${
                                msg.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                            }`}>
                            <div
                                className={`max-w-[85%] md:max-w-[75%] ${
                                    msg.role === "user"
                                        ? "items-end"
                                        : "items-start"
                                }`}>
                                <div
                                    className={`px-5 py-4 rounded-[1.8rem] shadow-sm leading-relaxed ${
                                        msg.role === "user"
                                            ? "bg-zinc-900 text-zinc-50 rounded-tr-none shadow-zinc-200"
                                            : "bg-white border border-zinc-200 text-zinc-800 rounded-tl-none shadow-zinc-100"
                                    }`}>
                                    <div
                                        className={`prose prose-sm max-w-none ${
                                            msg.role === "user"
                                                ? "prose-invert"
                                                : "prose-zinc"
                                        } prose-p:my-1`}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold text-zinc-400 mt-2 block px-2 uppercase tracking-tighter opacity-70 italic">
                                    {msg.timestamp.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* LOADING INDICATOR */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3">
                        <div className="px-5 py-4 bg-white border border-zinc-200 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-4 animate-pulse">
                            <Icons.ArrowPathIcon className="w-4 h-4 animate-spin text-orange-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                Elaborazione risposta...
                            </span>
                        </div>
                    </motion.div>
                )}
                <div
                    ref={scrollRef}
                    className="h-4"
                />
            </main>

            {/* INPUT FOOTER */}
            <footer className="p-6 bg-white border-t border-zinc-200 relative shadow-2xl">
                <div className="max-w-4xl mx-auto">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage(input);
                        }}
                        className="relative flex items-center gap-3">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Chiedi qualcosa alla workstation..."
                                disabled={isLoading}
                                className="w-full h-16 pl-6 pr-16 bg-zinc-100 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-zinc-900/10 transition-all font-medium text-zinc-800"
                            />
                            <div className="absolute right-3 top-3">
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="h-10 w-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-20 transition-all">
                                    <Icons.PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </footer>

            <style
                jsx
                global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
