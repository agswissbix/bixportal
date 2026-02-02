import React, { useState } from 'react';
import { toast } from 'sonner';
import { Upload, Check, AlertTriangle, FileText, CheckCircle2, XCircle } from 'lucide-react';
import axiosInstanceClient from '../../utils/axiosInstanceClient';
import { useRecordsStore } from '../records/recordsStore';

interface PropsInterface {
    tableid?: string;
    onClose?: () => void;
}

interface CompatibleField {
    header: string;
    fieldid: string;
}

export default function PopupImportCsv({
    tableid,
    onClose
}: PropsInterface) {
    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState<'select' | 'review' | 'importing'>('select');
    const [token, setToken] = useState<string | null>(null);
    const [compatible, setCompatible] = useState<CompatibleField[]>([]);
    const [incompatible, setIncompatible] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const { setRefreshTable } = useRecordsStore();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const checkCompatibility = async () => {
        if (!file || !tableid) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("apiRoute", "check_csv_compatibility")
        formData.append('file', file);
        formData.append('tableid', tableid);

        try {
            const response = await axiosInstanceClient.post('/postApi', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.data.success) {
                setToken(response.data.token);
                setCompatible(response.data.compatible);
                setIncompatible(response.data.incompatible);
                setStep('review');
            } else {
                toast.error(response.data.error || 'Errore durante l\'analisi del file');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Errore di connessione');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!token || !tableid) return;

        setLoading(true);
        try {
            const response = await axiosInstanceClient.post('/postApi', 
                {
                    apiRoute: "import_csv_data",
                    token: token,
                    tableid: tableid
                },
                {
                    headers: {
                         Authorization: `Bearer ${localStorage.getItem("token")}`,
                    }
                }
            );

            if (response.data.success) {
                toast.success(`Importazione completata: ${response.data.imported} record importati, ${response.data.errors} errori.`);
                setRefreshTable((v) => v + 1); // Reload table data
                onClose && onClose();
            } else {
                toast.error(response.data.error || 'Errore durante l\'importazione');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Errore di connessione');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                    <FileText size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Importa CSV</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Carica dati nella tabella {tableid}</p>
                </div>
            </div>

            {step === 'select' && (
                <div className="flex flex-col gap-6 flex-1 justify-center">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">Clicca per caricare</span> o trascina il file
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">CSV (separatore ; o ,)</p>
                        </div>
                        <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                    </label>

                    {file && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <FileText size={20} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1">
                                {file.name}
                            </span>
                            <button 
                                onClick={() => setFile(null)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <XCircle size={16} className="text-gray-400 hover:text-red-500" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {step === 'review' && (
                <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                    <div className="flex flex-col gap-2 overflow-auto">
                         <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-xl">
                            <h4 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <CheckCircle2 size={14} /> Campi Compatibili ({compatible.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {compatible.map((item, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                                        {item.header}
                                    </span>
                                ))}
                                {compatible.length === 0 && <span className="text-xs text-gray-400 italic">Nessun campo compatibile trovato</span>}
                            </div>
                        </div>

                        <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl">
                            <h4 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <AlertTriangle size={14} /> Campi Ignorati ({incompatible.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {incompatible.map((header, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 line-through decoration-red-300">
                                        {header}
                                    </span>
                                ))}
                                {incompatible.length === 0 && <span className="text-xs text-gray-400 italic">Nessun campo incompatibile</span>}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                        Solo i campi compatibili verranno importati. I dati verranno aggiunti alla tabella corrente.
                    </div>
                </div>
            )}

            <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                {step === 'select' ? (
                    <>
                        <button
                            className={`flex-1 px-4 py-3 font-bold rounded-xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 ${
                                !file || loading 
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                                : 'bg-primary hover:bg-primary/90 text-white'
                            }`}
                            onClick={checkCompatibility}
                            disabled={!file || loading}
                        >
                            {loading ? 'Analisi in corso...' : 'Analizza CSV'}
                        </button>
                    </>
                ) : (
                    <>
                         <button
                            className={`flex-1 px-4 py-3 font-bold rounded-xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 ${
                                loading 
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                                : 'bg-primary hover:bg-primary/90 text-white'
                            }`}
                            onClick={handleImport}
                            disabled={loading}
                        >
                             {loading ? 'Importazione...' : 'Conferma Importazione'}
                        </button>
                    </>
                )}
                
                <button
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all active:scale-95"
                    onClick={() => {
                        onClose && onClose()
                    }}
                    disabled={loading}
                >
                    Annulla
                </button>
            </div>
        </div>
    );
}
