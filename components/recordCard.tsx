import React, { useMemo, useState, useEffect, useContext, useCallback, useLayoutEffect } from 'react';
import { useRecordsStore } from './records/recordsStore';
import { CircleX, Maximize2, Info, Trash2, Copy } from 'lucide-react';
import CardBadge from './cardBadge';
import CardBadgeStabile from './customBadges/cardBadgeStabile';
import CardTabs from './cardTabs';
import { toast, Toaster } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import DynamicMenuItem, { CustomFunction } from './dynamicMenuItem';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import {SignatureDialog} from './signatureDialog';
import { sign } from 'crypto';
import CardBadgeCompany from './customBadges/cardBadgeCompany';
import CardBadgeDeal from './customBadges/cardBadgeDeal';
import CardBadgeProject from './customBadges/cardBadgeProject';
import CardBadgeTimesheet from './customBadges/cardBadgeTimesheet';

const isDev = false;

// PROPS INTERFACE
interface PropsInterface {
  tableid: string;
  recordid: string;
  mastertableid?: string;
  masterrecordid?: string;
  type: string;
  index?: number;
  total?: number;
}
interface ResponseInterface {
  fn: CustomFunction[];
}

interface TableSetting {
  tablesettings: Record<string, { type: string; value: string }>;
}

const WIDTH_WINDOW_MOBILE = 1280; // XL breakpoint

export default function RecordCard({
  tableid,
  recordid,
  mastertableid,
  masterrecordid,
  type,
  index = 0,
  total = 1,
}: PropsInterface) {
  const isNewRecord = !recordid;

  const [digitalSignature, setDigitalSignature] = useState<string | null>(null)
  const headerRef = React.useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // store + context
  const { removeCard, setOpenSignatureDialog, openSignatureDialog, setRefreshTable, handleRowClick } = useRecordsStore();
  const { activeServer, user } = useContext(AppContext);

  // layout / animation state
  const [animationClass, setAnimationClass] = useState('animate-slide-in'); // desktop animation
  const [animationClassMobile, setAnimationClassMobile] = useState('animate-mobile-slide-in'); // mobile animation (if you have it)
  const [isMaximized, setIsMaximized] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mountedTime, setMountedTime] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth < WIDTH_WINDOW_MOBILE : false); 

  // API for custom functions (desktop behavior kept)
  const responseDataDEFAULT: ResponseInterface = { fn: [] };
  const responseDataDEV: ResponseInterface = { fn: [] };
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_custom_functions',
      tableid,
    };
  }, [tableid]);

  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
    }
  }, [response, responseData]);

  const payloadSettings = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'settings_table_settings',
      tableid,
    };
  }, [tableid]);

  const { response: responseSettings, loading: loadingSettings, error: errorSettings } = !isDev && payloadSettings ? useApi<TableSetting>(payloadSettings) : { response: null, loading: false, error: null };

  useEffect(() => {
    if (!isDev && responseSettings && JSON.stringify(responseSettings) !== JSON.stringify(responseData)) {
      console.log('RecordCard: fetched table settings', responseSettings);
      setIsMaximized(responseSettings.tablesettings?.card_default_size?.value === 'max' ? true : false);
    }
  }, [responseSettings]);

  // dimension / responsive detection
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < WIDTH_WINDOW_MOBILE);
    // set initial (already set), attach listener
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // mounted time (like you had)
  useEffect(() => {
    const now = performance.now();
    const minutes = Math.floor(now / 60000);
    const seconds = Math.floor((now % 60000) / 1000);
    const centiseconds = Math.floor((now % 1000) / 10);
    setMountedTime(`${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`);
  }, []);

  // offset stacking (only applied on desktop non-mobile mode)
  const getOffset = () => {
    if (isMobile) return 0; // no stacking on mobile
    if (isMaximized) return 0;
    const baseOffset = 30; // px offset between stacked cards
    return (total - index - 1) * baseOffset;
  };

  // remove card animation
  const handleRemoveCard = () => {
    if (isMobile) {
      setAnimationClassMobile('animate-mobile-slide-out');
      setTimeout(() => removeCard(tableid, recordid), 300);
    } else {
      setAnimationClass('animate-slide-out');
      setTimeout(() => removeCard(tableid, recordid), 300);
    }
  };

  const handleSignatureChange = useCallback((signature: string | null) => {
    setDigitalSignature(signature)
  }, [])

  const handlePrintTimesheet = async (recordidAttachment: string) => {
    if (!digitalSignature) {
      toast.error('Nessuna firma digitale rilevata. Si prega di firmare prima di procedere.');
      return;
    }

    try {
        const response = await axiosInstanceClient.post(
            '/postApi',
            {
                apiRoute: "sign_timesheet",
                recordid: recordidAttachment
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                responseType: 'blob',
            }
        );

        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'timesheet_' + recordid + '.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Errore durante il salvataggio o il download:', error);
        toast.error('Errore durante il salvataggio o il download');
    }
  }

  const handleSaveSignature = async () => {
    if (!digitalSignature) {
      toast.error('Nessuna firma digitale rilevata. Si prega di firmare prima di procedere.');
      return;
    }

    try {
        const response = await axiosInstanceClient.post(
            '/postApi',
            {
                apiRoute: "save_signature",
                recordid: recordid,
                image: digitalSignature,
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.data.error) {
            toast.error('Errore durante il salvataggio della firma: ' + response.data.error);
            return;
        }
        toast.success('Firma salvata con successo.');
        console.log('Risposta dal server dopo il salvataggio della firma:', response, response.data.attachment_recordid);
        return response.data.attachment_recordid;

    } catch (error) {
        console.error('Errore durante il salvataggio o il download:', error);
        toast.error('Errore durante il salvataggio o il download');
    }
  }
  
  const duplicateRecord = async () => {
    try {
      const response = await axiosInstanceClient.post(
        '/postApi',
        {
          apiRoute: 'duplicate_record',
          tableid,
          recordid,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (response.data.success == true) {
        toast.success('Record duplicato con successo');
        handleRowClick('standard', response.data.new_recordid, tableid);
      }
    } catch (err) {
      console.error('Errore durante la duplicazione del record', err);
      toast.error('Errore durante la duplicazione del record');
    } finally {
      setRefreshTable((v) => v + 1)
    }
  };

  const deleteRecord = async () => {
    try {
      await axiosInstanceClient.post(
        '/postApi',
        {
          apiRoute: 'delete_record',
          tableid,
          recordid,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      toast.success('Record eliminato con successo');
    } catch (err) {
      console.error('Errore durante l\'eliminazione del record', err);
      toast.error('Errore durante l\'eliminazione del record');
    } finally {
      handleRemoveCard();
      setRefreshTable((v) => v + 1)
    }
  };

  const handleTrashClick = () => {
    toast.warning('Sei sicuro di voler eliminare questo record?', {
      action: {
        label: 'Conferma',
        onClick: async () => {await deleteRecord()},
      },
    });
  };

  useLayoutEffect(() => {
  if (typeof window === 'undefined') return;
  const el = headerRef.current;
  if (!el) return;

  const compute = () => {
    const rect = el.getBoundingClientRect();
    // se vuoi includere margin-bottom (es se header ha margin che deve essere conteggiata)
    const style = window.getComputedStyle(el);
    const marginBottom = parseFloat(style.marginBottom || '0') || 0;
    setHeaderHeight(Math.ceil(rect.height + marginBottom));
  };

  // misura immediata (sincrona)
  compute();

  // osserva i cambiamenti di dimensione (copre anche cambi di contenuto asincroni)
  let ro: ResizeObserver | undefined;
  if ((window as any).ResizeObserver) {
    ro = new ResizeObserver(() => {
      // debounce tramite rAF per evitare troppi re-render rapidi
      requestAnimationFrame(compute);
    });
    ro.observe(el);
  } else {
    // fallback: ricalcola al resize della finestra
    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    // cleanup rimuove listener in return
    return () => window.removeEventListener('resize', onResize);
  }

  // piccolo catch-all: rifai la misura al prossimo frame (utile per casi particolari)
  const rafId = requestAnimationFrame(compute);

  return () => {
    if (ro) ro.disconnect();
    cancelAnimationFrame(rafId);
  };
}, []);

  // render: two main modes (mobile centered modal-like vs desktop right-side card)
  // COMMON: keep header (info, funzioni, maximize, trash, close) and CardTabs below
  // Pass mobileView to CardTabs to allow child to adapt (if implemented)
  const containerStyleDesktop: React.CSSProperties = {
    right: `${getOffset() + 10}px`,
    top: `${8}vh`,
    marginTop: `${getOffset()}px`,
    zIndex: 40 + index,
  };

  return (
    <GenericComponent title="recordCard" response={responseData} error={error}>
      {(response: ResponseInterface) => (
        <>
          {/* Mobile mode: centered almost-fullscreen card */}
          {isMobile ? (
            <div
              className={`fixed inset-x-0 mx-auto shadow-[0_3px_10px_rgb(0,0,0,0.2)] bg-gray-50 rounded-xl border-2 border-gray-50 p-3 ${animationClassMobile} w-11/12 h-5/6 max-w-4xl transition-all duration-300`}
              style={{ top: '6vh', zIndex: 20 + index }}
            >
              {/* Header */}
              <div className="h-min w-full">
                <div className="h-1/6 w-full flex justify-between items-center px-4">
                  <div className="flex items-center gap-2">
                    {/* Close X - always visible on mobile top-left of card */}
                    <button
                      className="p-1.5 rounded-full hover:bg-gray-100 hover:scale-110 transition-all duration-100 ease-in-out"
                      onClick={handleRemoveCard}
                      title="Chiudi"
                    >
                      <CircleX className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                    </button>

                    {/* Optional info button */}
                    <button
                      onClick={() => setShowInfoPopup(!showInfoPopup)}
                      title="Mostra info"
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors hover:scale-110"
                    >
                      <Info className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* FUNCTIONS dropdown - mobile: keep accessible */}
                    <div className="relative">
                      <button
                        className="text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-md text-xs px-3 py-1.5 inline-flex items-center"
                        type="button"
                        onClick={() => setShowDropdown(!showDropdown)}
                      >
                        Funzioni
                        <svg className="w-2 h-2 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>

                      {showDropdown && (
                        <div className="absolute right-0 z-10 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <ul className="py-1 text-sm text-gray-700">
                            {response.fn.map((fn) => fn.context === 'cards' && (
                              <DynamicMenuItem
                                      key={fn.title}
                                      fn={fn} // Ora fn.params è un vero oggetto (o null)
                                      params={{
                                        recordid: recordid,
                                        ...(typeof fn.params === 'object' && fn.params ? fn.params : {})
                                      }}
                                      onClick={() => setShowDropdown(false)}
                                    />                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Trash */}
                    <button
                      className="p-1.5 rounded-full hover:bg-red-100 hover:scale-110 transition-all duration-100 ease-in-out"
                      onClick={handleTrashClick}
                      title="Elimina"
                    >
                      <Trash2 className="w-5 h-5 text-red-500 hover:text-red-700" />
                    </button>
                    <button
                      className="p-1.5 rounded-full hover:bg-gray-100 hover:scale-110 transition-all duration-100 ease-in-out"
                      onClick={duplicateRecord}
                      title="Duplica"
                    >
                      <Copy className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                    </button>
                  </div>
                </div>
              </div>

              

              {/* Info popup (mobile) */}
              {showInfoPopup && (
                <div className="absolute top-4 left-4 z-30 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-72">
                  <h3 className="text-lg font-semibold mb-2">Info record</h3>
                  <ul className="text-sm text-gray-700">
                    <li><strong>Table ID:</strong> {tableid}</li>
                    <li><strong>Record ID:</strong> {recordid}</li>
                    <li><strong>Master Table ID:</strong> {mastertableid || '-'}</li>
                    <li><strong>Master Record ID:</strong> {masterrecordid || '-'}</li>
                  </ul>
                  <button onClick={() => setShowInfoPopup(false)} className="mt-3 bg-gray-100 hover:bg-gray-200 text-sm px-3 py-1 rounded">
                    Chiudi
                  </button>
                </div>
              )}

              {/* Card content - pass mobileView so child can adapt */}
              <div className="h-fill w-full overflow-auto mt-3 mb-8">
                {!isNewRecord && (
                  <>
                  {tableid === 'stabile' ? (
                    <CardBadgeStabile tableid={tableid} recordid={recordid} />
                  ) : tableid === 'company' ? (
                    <CardBadgeCompany tableid={tableid} recordid={recordid} />
                  ) : tableid === 'deal' ? (
                    <CardBadgeDeal tableid={tableid} recordid={recordid} />
                  ) : tableid === 'project' ? (
                    <CardBadgeProject tableid={tableid} recordid={recordid} />
                  ) : tableid === 'timesheet' ? (
                    <CardBadgeTimesheet tableid={tableid} recordid={recordid} />
                  ) : activeServer !== 'belotti' ? (
                    <CardBadge tableid={tableid} recordid={recordid} />
                  ) : null}
                  </>
                )}

                <div className="mt-3">
                  <CardTabs
                    tableid={tableid}
                    recordid={recordid}
                    mastertableid={mastertableid}
                    masterrecordid={masterrecordid}
                    // mobileView={true} // child may use to disable collapse etc.
                  />
                </div>
              </div>
            </div>
          ) : (
            /* DESKTOP MODE: right-side stacked card (original desktop behavior preserved) */
            <div
              className={`absolute shadow-[0_3px_10px_rgb(0,0,0,0.2)] bg-card-background z-10 rounded-xl border-2 border-card-border p-3 ${animationClass} ${
                isMaximized ? 'right-0 w-5/6 h-5/6' : 'w-2/6 h-5/6'
              } transition-all duration-300`}
              style={containerStyleDesktop}
            >
              {/* optional small info popup */}
              {showInfoPopup && (
                <div className="absolute top-5 left-5 z-30 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-72">
                  <h3 className="text-lg font-semibold mb-2">Info record</h3>
                  <ul className="text-sm text-gray-700">
                    <li><strong>Table ID:</strong> {tableid}</li>
                    <li><strong>Record ID:</strong> {recordid}</li>
                    <li><strong>Master Table ID:</strong> {mastertableid || '-'}</li>
                    <li><strong>Master Record ID:</strong> {masterrecordid || '-'}</li>
                  </ul>
                  <button onClick={() => setShowInfoPopup(false)} className="mt-3 bg-gray-100 hover:bg-gray-200 text-sm px-3 py-1 rounded">
                    Chiudi
                  </button>
                </div>
              )}

              <div className=" w-full" ref={headerRef}>
                <div className="h-1/6 w-full flex justify-between items-center px-4 mb-2">
                  <div className="flex-grow flex items-center gap-4">
                    {/* X ALWAYS VISIBLE */}
                    <button
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors hover:scale-110"
                      onClick={handleRemoveCard}
                      title="Chiudi"
                    >
                      <CircleX className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                    </button>
                    <button
                      onClick={() => setIsMaximized(!isMaximized)}
                      title="Ingrandisci"
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors hover:scale-110"
                    >
                      <Maximize2 className="w-6 h-6 text-gray-500 hover:text-gray-700 rotate-90" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 w-full justify-end">
                    {activeServer !== 'belotti' && (
                      <>
                        {/* Dropdown menu (desktop) */}
                        <div className="relative w-full">
                          <button
                            className="theme-secondary w-1/2 float-end focus:outline-none focus:ring-2 focus:ring-accent/20 font-medium rounded-md text-sm px-5 py-2.5 inline-flex items-center justify-center"
                            type="button"
                            onClick={() => setShowDropdown(!showDropdown)}
                          >
                            Funzioni
                            <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                            </svg>
                          </button>

                          {showDropdown && (
                            <div className="absolute right-0 mt-10 w-1/2 bg-white border border-gray-200 rounded-md shadow-lg z-30">
                              <ul className="py-1">
                                {response.fn.map((originalFn) => {
                                  if (originalFn.context !== 'cards') return null;

                                  // Crea una copia di fn per non modificare lo stato originale
                                  const fn = { ...originalFn };

                                  // Tenta di convertire fn.params da stringa JSON a oggetto
                                  try {
                                    if (fn.params && typeof fn.params === 'string') {
                                      fn.params = JSON.parse(fn.params);
                                    }
                                  } catch (error) {
                                    console.error("Errore nel parsing di fn.params:", fn.params, error);
                                    // Se il parsing fallisce, lo lasciamo come stringa o lo impostiamo a null
                                    fn.params = null; 
                                  }

                                  return (
                                    <DynamicMenuItem
                                      key={fn.title}
                                      fn={fn} // Ora fn.params è un vero oggetto (o null)
                                      params={{
                                        recordid: recordid,
                                        ...(typeof fn.params === 'object' && fn.params ? fn.params : {})
                                      }}
                                      onClick={() => setShowDropdown(false)}
                                    />
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </div>

                        <button
                          className="p-2 rounded-full hover:bg-red-100 hover:scale-110 transition-colors hover:scale-110"
                          onClick={handleTrashClick}
                          title="Elimina"
                        >
                          <Trash2 className="w-6 h-6 text-red-500 hover:text-red-700" />
                        </button>
                        <button
                          className="p-1.5 rounded-full hover:bg-gray-100 hover:scale-110 transition-all duration-100 ease-in-out"
                          onClick={duplicateRecord}
                          title="Duplica"
                        >
                          <Copy className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                        </button>
                      </>
                    )}

                    {activeServer !== 'belotti' && (
                      <button
                        onClick={() => setShowInfoPopup(!showInfoPopup)}
                        title="Mostra info"
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors hover:scale-110"
                      >
                        <Info className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                      </button>
                    )}

                    { activeServer === 'belotti' && (
                      <>
                      {response.fn.map((originalFn) => {
                        if (originalFn.context !== 'cards') return null;

                        // Crea una copia di fn per non modificare lo stato originale
                        const fn = { ...originalFn };

                        // Tenta di convertire fn.params da stringa JSON a oggetto
                        try {
                          if (fn.params && typeof fn.params === 'string') {
                            fn.params = JSON.parse(fn.params);
                          }
                        } catch (error) {
                          console.error("Errore nel parsing di fn.params:", fn.params, error);
                          // Se il parsing fallisce, lo lasciamo come stringa o lo impostiamo a null
                          fn.params = null; 
                        }
                        return (
                          <DynamicMenuItem
                            key={fn.title}
                            fn={fn}
                            params={{
                              recordid: recordid,
                              ...(typeof fn.params === 'object' && fn.params ? fn.params : {})
                            }}
                            />
                        )
                      })}
                      </>
                    )}
                  </div>
                </div>

                {!isNewRecord && (
                  <>
                    {tableid === 'stabile' ? (
                      <CardBadgeStabile tableid={tableid} recordid={recordid} />
                    ) : tableid === 'company' ? (
                      <CardBadgeCompany tableid={tableid} recordid={recordid} />
                    ) : tableid === 'deal' ? (
                      <CardBadgeDeal tableid={tableid} recordid={recordid} />
                    ) : tableid === 'project' ? (
                      <CardBadgeProject tableid={tableid} recordid={recordid} />
                    ) : tableid === 'timesheet' ? (
                      <CardBadgeTimesheet tableid={tableid} recordid={recordid} />
                    ) : activeServer !== 'belotti' ? (
                      <CardBadge tableid={tableid} recordid={recordid} />
                    ) : null}
                  </>
                )}
              </div>

                {/* CardTabs container with dynamic height */}
                <div
                className="w-full overflow-auto"
                style={{
                  height: `calc(100% - ${headerHeight}px)`, // 120px is approx header + badge height, adjust as needed
                }}
                >
                <CardTabs
                  tableid={tableid}
                  recordid={recordid}
                  mastertableid={mastertableid}
                  masterrecordid={masterrecordid}
                  // mobileView={false}
                />
                </div>
            </div>
          )}
          {/* Signature dialog - reuse component */}
          <SignatureDialog 
            isOpen={openSignatureDialog} 
            onOpenChange={setOpenSignatureDialog} 
            onSaveSignature={handleSaveSignature}
            onSignatureChange={handleSignatureChange}
            onDownload={(savedSignature) => handlePrintTimesheet(savedSignature)} />
          <Toaster richColors />
        </>
      )}
    </GenericComponent>
  );
}
