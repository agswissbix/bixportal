import React from "react";
import { CheckCircle2, Info, Copy } from "lucide-react";
import { toast } from "sonner";
import { useRecordsStore } from "../records/recordsStore";
import ReactMarkdown from "react-markdown";

interface PropsInterface {
    title?: string;
    message: string;
    type?: "info" | "success" | "warning";
    onClose?: () => void;
}

export default function PopupInfo({
    title = "Risultato Elaborazione",
    message,
    type = "info",
    onClose,
}: PropsInterface) {
    const { setPopupResolver, setIsPopupOpen } = useRecordsStore();

    const handleClose = () => {
        setPopupResolver(null);
        setIsPopupOpen(false);
        onClose && onClose();
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(message);
        toast.success("Copiato negli appunti!");
    };

    const config = {
        success: {
            icon: (
                <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
            ),
            border: "border-emerald-100 dark:border-emerald-900/30",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
        },
        info: {
            icon: <Info className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />,
            border: "border-blue-100 dark:border-blue-900/30",
            bg: "bg-blue-50 dark:bg-blue-900/20",
        },
        warning: {
            icon: <Info className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />,
            border: "border-amber-100 dark:border-amber-900/30",
            bg: "bg-amber-50 dark:bg-amber-900/20",
        },
    };

    const style = config[type];

    return (
        <div className="w-[95%] sm:w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
                <div
                    className={`p-2 sm:p-3 rounded-2xl ${style.bg} border ${style.border}`}>
                    {style.icon}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">
                    {title}
                </h3>
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-2">
                <label className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Risposta dal server
                </label>

                <div className="relative group flex-1">
                    <div className="w-full p-3 sm:p-4 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl overflow-y-auto min-h-[100px] max-h-[50vh] sm:max-h-[400px] text-gray-700 dark:text-gray-300 prose dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown>
                            {message || "Nessun contenuto ricevuto dal server."}
                        </ReactMarkdown>
                    </div>

                    {message && (
                        <button
                            onClick={copyToClipboard}
                            className="absolute top-2 right-2 p-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm shadow-sm border border-gray-200 dark:border-gray-600 rounded-lg active:scale-90 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                            title="Copia negli appunti">
                            <Copy
                                size={16}
                                className="text-gray-500 dark:text-gray-300"
                            />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex gap-3 mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                    className="flex-1 px-4 py-3.5 sm:py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all active:scale-95 shadow-sm text-sm sm:text-base"
                    onClick={handleClose}>
                    Ho capito
                </button>
            </div>
        </div>
    );
}
