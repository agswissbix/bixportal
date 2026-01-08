import React, { useState } from "react";
import { toast } from "sonner";
import { useRecordsStore } from "../records/recordsStore";

interface PropsInterface {
    tableid?: string;
    recordid?: string;
    onClose?: () => void;
}

const servizi = [
    { id: "1", name: "Amministrazione" },
    { id: "2", name: "Assistenza IT" },
    { id: "3", name: "Assistenza PBX" },
    { id: "4", name: "Assistenza SW" },
    { id: "5", name: "Assistenza Web Hosting" },
    { id: "6", name: "Commerciale" },
    { id: "7", name: "Formazione Apprendista" },
    { id: "8", name: "Formazione e Test" },
    { id: "9", name: "Interno" },
    { id: "10", name: "Lenovo" },
    { id: "11", name: "Printing" },
    { id: "12", name: "Riunione" },
];

export default function PopupService({
    tableid,
    recordid,
    onClose,
}: PropsInterface) {
    const [service, setService] = useState<string>("");

    const { popupResolver, setPopupResolver, setIsPopupOpen } =
        useRecordsStore();

    const save = () => {
        if (!service) {
            toast.error("Compila tutti i campi obbligatori");
            return;
        }

        if (popupResolver) {
            popupResolver({service});
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
        <div className="h-full w-full p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Servizio
                </label>
                <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                    <option
                        value=""
                        disabled>
                        Seleziona un servizio...
                    </option>
                    {servizi.map((s) => (
                        <option
                            key={s.id}
                            value={s.name}>
                            {s.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex gap-3 mt-auto pt-4">
                <button
                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all active:scale-95 shadow-sm"
                    onClick={save}>
                    Salva
                </button>
                <button
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all active:scale-95"
                    onClick={cancel}>
                    Annulla
                </button>
            </div>
        </div>
    );
}
