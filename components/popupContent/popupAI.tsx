import React, { useState } from "react";
import { toast } from "sonner";
import { useRecordsStore } from "../records/recordsStore";
import { Bot, User } from "lucide-react";

interface PropsInterface {
    tableid?: string;
    recordid?: string;
    onClose?: () => void;
}

export default function PopupAI({
    tableid,
    recordid,
    onClose,
}: PropsInterface) {
    const [useAI, setuseAI] = useState<boolean>(true);

    const { popupResolver, setPopupResolver, setIsPopupOpen } =
        useRecordsStore();

    const save = () => {
        if (popupResolver) {
            popupResolver({ useAI });
            setPopupResolver(null);
            setIsPopupOpen(false);
        }

        onClose && onClose();
    };

    const cancel = () => {
        if (popupResolver) {
            popupResolver(null);
            setPopupResolver(null);
        }
        setIsPopupOpen(false);
        onClose && onClose();
    };

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                    Come preferisci creare la descrizione del timesheet?
                </label>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setuseAI(true)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                            useAI
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"
                        }`}>
                        <Bot size={32} />
                        <span className="font-bold text-sm">Usa AI</span>
                    </button>

                    <button
                        onClick={() => setuseAI(false)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                            !useAI
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"
                        }`}>
                        <User size={32} />
                        <span className="font-bold text-sm">Manuale</span>
                    </button>
                </div>
            </div>

            <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all active:scale-95 shadow-sm"
                    onClick={save}>
                    Conferma
                </button>
                <button
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all active:scale-95"
                    onClick={cancel}>
                    Annulla
                </button>
            </div>
        </div>
    );
}
