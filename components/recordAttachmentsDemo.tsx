import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { SquarePlus } from 'lucide-react';
import { useRecordsStore } from './records/recordsStore';



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
    note?: string;
  }>
}

export default function RecordAttachmentsDemo({ tableid, recordid }: PropsInterface) {
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

  const { handleRowClick } = useRecordsStore();

  // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  //set first attachment as selected
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo)
  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
    }
  }, [response, responseData]);
  
  useEffect(() => {
    if (responseData.attachments.length > 0) {
      setSelectedAttachment(responseData.attachments[0]);
    }
  }, [responseData.attachments]);
  

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

// ...tutto invariato sopra

return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
        <div className="h-full w-full flex">
          {/* Colonna sinistra - Lista allegati */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-white flex flex-col rounded-lg">
            <div className="sticky top-0 z-10 p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
              <div className="text-sm font-semibold text-gray-700">Allegati ({response.attachments.length})</div>
            </div>
  
            <div className="sticky top-10 z-10 p-3 flex justify-center bg-white border-b border-gray-200">
              <button
                className="w-full font-semibold flex items-center justify-center gap-2 text-bixcolor-default px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-150 shadow-sm"
                onClick={() => handleRowClick('linked', '', 'attachment', tableid, recordid)}
              >
                <SquarePlus size={18} />
                Aggiungi
              </button>
            </div>
  
            <div className="grid 3xl:grid-cols-2 lg:grid-cols-1 gap-3 p-3 overflow-y-auto">
              {response.attachments.map((attachment, index) => {
                const filePath = attachment.file;
                const extension = filePath.split('.').pop()?.toLowerCase();
                const filename = filePath.split('/').pop();
  
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedAttachment(attachment)}
                    className={`flex flex-col rounded-lg cursor-pointer border transition-all duration-150 hover:shadow-md ${
                      selectedAttachment?.recordid === attachment.recordid 
                        ? 'ring-2 ring-blue-200 border-blue-300 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="w-full text-center text-xs text-white font-semibold py-1 bg-red-600 rounded-t">
                      {extension?.toUpperCase() || 'FILE'}
                    </div>
  
                    <div className="p-2 flex justify-center items-center border-b border-gray-200">
                      {['jpg', 'jpeg', 'png', 'gif'].includes(extension) ? (
                        <div className="relative w-full pt-[75%]">
                          <img
                            src={`/api/media-proxy?url=${filePath}`}
                            alt={filename}
                            className="absolute inset-0 h-full w-full object-cover rounded"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-2">
                          <div className="text-3xl opacity-80 mb-1">{getFileIcon(extension)}</div>
                          <div className="text-xs font-medium text-gray-500">{extension?.toUpperCase()}</div>
                        </div>
                      )}
                    </div>
  
                    <div className="p-2">
                      <div className="text-xs text-center truncate w-full px-1 text-gray-700" title={attachment.note || filename}>
                        {attachment.note || filename}
                      </div>
                    </div>
                  </div>
                );
              })}
  
              {response.attachments.length === 0 && (
                <div className="flex flex-col items-center justify-center text-gray-400 py-12 col-span-2">
                  <div className="text-5xl mb-3">📁</div>
                  <p>Nessun allegato disponibile</p>
                </div>
              )}
            </div>
          </div>
  
          {/* Colonna destra - Visualizzazione allegato */}
          <div className="w-2/3 flex flex-col h-full bg-gray-50">
            <div className="sticky top-0 z-10 flex items-center justify-between p-3 border-b border-gray-200  shadow-sm">
              <div className="flex-1 text-center text-sm font-medium text-gray-700 truncate">
                {selectedAttachment ? selectedAttachment.note || selectedAttachment.file.split('/').pop() : 'Seleziona un allegato'}
              </div>
            </div>
  
            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
              {selectedAttachment ? (
                /\.(jpg|jpeg|png|gif)$/i.test(selectedAttachment.file) ? (
                  <img
                    src={`/api/media-proxy?url=${selectedAttachment.file}`}
                    alt={selectedAttachment.note || selectedAttachment.file.split('/').pop()}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full h-full rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      src={`/api/media-proxy?url=${selectedAttachment.file}`}
                      title={selectedAttachment.note || selectedAttachment.file}
                      className="w-full h-full border-0"
                    />
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-lg mb-1">Nessun file selezionato</p>
                  <p className="text-sm">Seleziona un allegato dalla lista per visualizzarlo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </GenericComponent>
  );
  
}