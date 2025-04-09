import React, { useEffect, useRef, useState } from 'react';
import { FileIcon, Upload, X, Download } from 'lucide-react';

interface PropsInterface {
  initialValue?: File | string | null;
  onChange?: (file: File | null) => void;
}

export default function InputFile({ initialValue = null, onChange }: PropsInterface) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Pulizia vecchio blob
    return () => {
      if (fileUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  useEffect(() => {
    if (initialValue && typeof initialValue === 'string') {
      // È un URL?
      const isProbablyUrl = initialValue.includes('/') || initialValue.startsWith('http');
      if (isProbablyUrl) {
        const name = decodeURIComponent(initialValue.split('/').pop() || 'file');
        setFileName(name);
        setFileUrl(initialValue);
      } else {
        // È solo testo? Crea un blob
        const blob = new Blob([initialValue], { type: 'text/plain' });
        const blobUrl = URL.createObjectURL(blob);
        setFileName('testo.txt');
        setFileUrl(blobUrl);
      }
    } else if (initialValue instanceof File) {
      setFile(initialValue);
      setFileName(initialValue.name);
      setFileUrl(null);
    }
  }, [initialValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setFileName(selected?.name || '');
    setFileUrl(null);
    onChange?.(selected);
  };

  const handleRemove = () => {
    if (fileUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(fileUrl);
    }
    setFile(null);
    setFileName('');
    setFileUrl(null);
    onChange?.(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-xl">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center px-3 py-2 bg-green-50 text-green-600 rounded-md border border-green-200 hover:bg-green-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-opacity-50"
      >
        <Upload className="w-4 h-4 mr-1.5" />
        <span className="text-sm font-medium">Scegli file</span>
      </button>
      
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
          {fileName ? (
            <div className="flex items-center w-full">
              <FileIcon className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate flex-1" title={fileName}>
                {fileName}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Nessun file selezionato</span>
          )}
        </div>
      </div>
      
      {fileName && (
        <div className="flex items-center gap-2">
          {fileUrl && (
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = fileUrl;
                console.log(fileUrl);
                link.download = fileName;  // Usa il nome del file per il download
                link.click();  // Simula un click sul link per avviare il download
              }}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors"
              title="Scarica il file"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          
          <button
            onClick={handleRemove}
            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md border border-red-200 hover:bg-red-100 transition-colors"
            title="Rimuovi il file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}