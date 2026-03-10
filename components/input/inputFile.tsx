import React, { useEffect, useRef, useState } from 'react';
import { FileIcon, Upload, X, Download, ZoomIn } from 'lucide-react';

interface PropsInterface {
  initialValue?: File | string | null;
  onChange?: (file: File | null) => void;
}

function getFileType(name: string): 'image' | 'pdf' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}

export default function InputFile({ initialValue = null, onChange }: PropsInterface) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileType = fileName ? getFileType(fileName) : 'other';

  // Blob URL per i file locali
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setBlobUrl(null);
    }
  }, [file]);

  useEffect(() => {
    if (initialValue && typeof initialValue === 'string') {
      const isProbablyUrl = initialValue.includes('/') || initialValue.startsWith('http');
      if (isProbablyUrl) {
        const name = decodeURIComponent(initialValue.split('/').pop() || 'file');
        setFileName(name);
        setFileUrl(initialValue);
      } else {
        const blob = new Blob([initialValue], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        setFileName('testo.txt');
        setFileUrl(url);
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
    setFile(null);
    setFileName('');
    setFileUrl(null);
    setPreviewOpen(false);
    onChange?.(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    const href = blobUrl || fileUrl;
    if (!href) return;
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    link.click();
  };

  const previewSrc = blobUrl || fileUrl;

  return (
    <div className="flex flex-col gap-2 w-full max-w-xl">
      {/* Riga principale: bottone + nome file + azioni */}
      <div className="flex items-center gap-2 w-full">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center px-3 py-2 bg-green-50 text-green-600 rounded-md border border-green-200 hover:bg-green-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-opacity-50 flex-shrink-0"
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
          <div className="flex items-center gap-2 flex-shrink-0">
            {previewSrc && (fileType === 'image' || fileType === 'pdf') && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md border border-purple-200 hover:bg-purple-100 transition-colors"
                title="Anteprima"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            )}

            {(blobUrl || fileUrl) && (
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors"
                title="Scarica il file"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md border border-red-200 hover:bg-red-100 transition-colors"
              title="Rimuovi il file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Anteprima inline compatta */}
      {fileName && previewSrc && (
        <div className="rounded-md border border-gray-200 overflow-hidden bg-gray-50">
          {fileType === 'image' && (
            <img
              src={previewSrc}
              alt={fileName}
              className="max-h-48 w-full object-contain cursor-zoom-in"
              onClick={() => setPreviewOpen(true)}
            />
          )}
          {fileType === 'pdf' && (
            <iframe
              src={previewSrc}
              title={fileName}
              className="w-full h-48 border-0 cursor-pointer"
              onClick={() => setPreviewOpen(true)}
            />
          )}
        </div>
      )}

      {/* Modal anteprima grande */}
      {previewOpen && previewSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700 truncate">{fileName}</span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-2">
              {fileType === 'image' && (
                <img
                  src={previewSrc}
                  alt={fileName}
                  className="max-w-full max-h-[75vh] object-contain mx-auto block"
                />
              )}
              {fileType === 'pdf' && (
                <iframe
                  src={previewSrc}
                  title={fileName}
                  className="w-full border-0"
                  style={{ height: '75vh' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}