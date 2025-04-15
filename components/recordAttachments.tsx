import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
interface PropsInterface {
  tableid: string;
  recordid: string;
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
  attachments: Array<{
    recordid: string;
    file: string;
    type?: string;
  }>
}

export default function RecordAttachments({ tableid, recordid }: PropsInterface) {
  //DATI
  // DATI PROPS PER LO SVILUPPO
  const devPropExampleValue = isDev ? "Example prop" : tableid;

  // DATI RESPONSE DI DEFAULT
  const responseDataDEFAULT: ResponseInterface = {
    attachments: []
  };

  // DATI RESPONSE PER LO SVILUPPO 
  const responseDataDEV: ResponseInterface = {
    attachments: [
      {
        recordid: "test1",
        file: "documento.pdf",
        type: "text"
      },
      {
        recordid: "test2",
        file: "immagine.jpg",
        type: "text"
      },
      {
        recordid: "test3",
        file: "rapporto.docx",
        type: "text"
      },
      {
        recordid: "test4",
        file: "presentazione.pptx",
        type: "text"
      },
    ]
  };

  // DATI DEL CONTESTO
  const { user } = useContext(AppContext);

  // IMPOSTAZIONE DELLA RESPONSE (non toccare)
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

  // PAYLOAD (solo se non in sviluppo)
  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_record_attachments',
      tableid: tableid,
      recordid: recordid,
    };
  }, [tableid, recordid]);

  // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo)
  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
    }
  }, [response, responseData]);

  // Ottieni icona appropriata in base all'estensione del file
  const getFileIcon = (extension) => {
    if (!extension) return "📎";
    
    switch(extension.toLowerCase()) {
      case 'pdf': return "📄";
      case 'doc': case 'docx': return "📝";
      case 'xls': case 'xlsx': return "📊";
      case 'ppt': case 'pptx': return "📑";
      case 'txt': return "📃";
      case 'zip': case 'rar': return "🗜️";
      case 'jpg': case 'jpeg': case 'png': case 'gif': return "🖼️";
      default: return "📎";
    }
  };

  return (
    <GenericComponent response={responseData} loading={loading} error={error}> 
      {(response: ResponseInterface) => (
        <div className="p-4 h-full w-full overflow-y-auto bg-gray-50">
          <div className="grid grid-cols-4 3xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-3  gap-4">
            {response.attachments.map((attachment, index) => {
              const filePath = attachment.file;
              const extension = filePath.split('.').pop()?.toLowerCase();
              const filename = filePath.split('/').pop();
              
              return (
                <div key={index} className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                  {/* Preview Area */}
                  <div className="h-28 flex items-center justify-center p-3 border-b border-gray-100">
                    {extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'gif' ? (
                      <img
                        src={`/api/media-proxy?url=${filePath}`}
                        alt={filename}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-4xl opacity-80">{getFileIcon(extension)}</div>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-800 truncate mb-1" title={filename}>
                      {filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {extension ? extension.toUpperCase() : 'File'}
                    </p>
                  </div>
                  
                  {/* Actions Area - Appears on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex space-x-2">
                      <a
                        href={`/api/media-proxy?url=${filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-gray-800 hover:bg-blue-50 rounded-full px-3 py-1 text-xs font-medium flex items-center shadow-md hover:shadow-lg transition-all"
                      >
                        Apri
                      </a>
                      <a
                        href={`/api/media-proxy?url=${filePath}&download=true`}
                        download
                        className="bg-white text-gray-800 hover:bg-blue-50 rounded-full px-3 py-1 text-xs font-medium flex items-center shadow-md hover:shadow-lg transition-all" 
                      >
                        Scarica
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {response.attachments.length === 0 && (
            <div className="flex flex-col items-center justify-center text-gray-400 py-12">
              <div className="text-5xl mb-3">📁</div>
              <p>Nessun allegato disponibile</p>
            </div>
          )}
        </div>
      )}
    </GenericComponent>
  );
}