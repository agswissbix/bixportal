'use client';

import React, { useMemo, useContext, useState, useEffect, useRef } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import InputWord from './inputWord';
import InputNumber from './inputNumber';
import InputDate from './inputDate';
import InputMemo from './inputMemo';
import InputCheckbox from './inputCheckbox';
import SelectUser from './selectUser';
import SelectStandard from './selectStandard';
import InputLinked from './inputLinked';
import InputEditor from './inputEditor';
import InputFile from './inputFile';
import { toast } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { useRecordsStore } from './records/recordsStore';
import { Tooltip } from 'react-tooltip';
import LoadingComp from './loading';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

const isDev = false;

interface PropsInterface {
  tableid: string;
  recordid: string;
  mastertableid?: string;
  masterrecordid?: string;
}

// NUOVA INTERFACCIA: Aggiunto il campo opzionale 'label' per il raggruppamento
interface FieldInterface {
  tableid: string;
  fieldid: string;
  fieldorder: string;
  description: string;
  value: string | { code: string; value: string };
  fieldtype: string;
  label?: string; // <-- CAMPO AGGIUNTO per raggruppare
  lookupitems?: Array<{ itemcode: string; itemdesc: string }>;
  lookupitemsuser?: Array<{ userid: string; firstname: string; lastname: string; link: string; linkdefield: string; linkedvalue: string }>;
  fieldtypewebid?: string;
  linked_mastertable?: string;
  settings: string | { calcolato: string; default: string; nascosto: string; obbligatorio: string };
  isMulti?: boolean;
}

interface ResponseInterface {
  fields: Array<FieldInterface>;
  recordid: string;
}

export default function CardFields({ tableid, recordid, mastertableid, masterrecordid }: PropsInterface) {
  const [delayedLoading, setDelayedLoading] = useState(true);
  const dummyInputRef = useRef<HTMLInputElement>(null);

  const responseDataDEFAULT: ResponseInterface = { fields: [], recordid: '' };
  const { activeServer } = useContext(AppContext);

  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? undefined as any : responseDataDEFAULT);
  const [updatedFields, setUpdatedFields] = useState<{ [key: string]: string | string[] }>({});
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);

  // NUOVO STATE: Gestisce lo stato (aperto/chiuso) di ogni accordion
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  // NUOVO STATE: Per indicare che un calcolo è in corso
  const [isCalculating, setIsCalculating] = useState(false);
  
  // NUOVO REF: Per gestire il debounce
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { removeCard, setRefreshTable } = useRecordsStore();

  const currentValues = useMemo(() => {
    const obj: Record<string, any> = {};
    responseData?.fields.forEach(f => {
      const backendValue =
        typeof f.value === 'object' ? (f.value as any).code ?? (f.value as any).value : f.value;
      obj[f.fieldid] = updatedFields.hasOwnProperty(f.fieldid) ? updatedFields[f.fieldid] : backendValue ?? '';
    });
    return obj;
  }, [responseData, updatedFields]);

  // NUOVA LOGICA: Raggruppa i campi per la loro label usando useMemo
  const groupedFields = useMemo(() => {
    if (!responseData?.fields) return {};

    return responseData.fields.reduce((acc: Record<string, FieldInterface[]>, field) => {
      // Se un campo non ha label, viene assegnato al gruppo di default "Dati"
      const label = field.label || 'Dati';
      if (!acc[label]) {
        acc[label] = [];
      }
      acc[label].push(field);
      return acc;
    }, {});
  }, [responseData]);

  // NUOVO EFFETTO: Inizializza gli accordion come aperti quando i dati sono caricati
  useEffect(() => {
    const labels = Object.keys(groupedFields);
    const initialAccordionState: Record<string, boolean> = {};
    labels.forEach(label => {
      if (label !== 'Dati') {
        initialAccordionState[label] = true; // Imposta tutti gli accordion come aperti di default
      }
    });
    setOpenAccordions(initialAccordionState);
  }, [groupedFields]);

  useEffect(() => {
    const requiredFields = responseData?.fields.filter(
      field => typeof field.settings === 'object' && field.settings.obbligatorio === 'true'
    ) || [];

    if (requiredFields.length === 0) {
      setIsSaveDisabled(Object.keys(updatedFields).length === 0); // Disabilita se non ci sono modifiche
      return;
    }

    const allRequiredFilled = requiredFields.every(field => {
      const value = currentValues[field.fieldid];
      return value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);
    });
    
    // Abilita il salvataggio solo se i campi obbligatori sono compilati E ci sono modifiche
    setIsSaveDisabled(!allRequiredFilled || Object.keys(updatedFields).length === 0);
  }, [currentValues, responseData?.fields, updatedFields]);


  
  // NUOVA FUNZIONE: Esegue la chiamata al backend per i calcoli
  const triggerCalculation = async (values: Record<string, any>) => {
    // Non eseguire calcoli se non ci sono modifiche
    if (Object.keys(updatedFields).length === 0) return;

    setIsCalculating(true);
    try {
      const payload = {
        apiRoute: 'calculate_dependent_fields', // Nuovo endpoint logico
        tableid,
        recordid,
        fields: values, // Invia tutti i valori correnti
      };

      const { data } = await axiosInstanceClient.post('/postApi', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
      // Se il backend restituisce campi aggiornati
      if (data && data.updated_fields) {
        // 1. Aggiungi i valori calcolati a updatedFields per il salvataggio finale
        setUpdatedFields(prev => ({ ...prev, ...data.updated_fields }));

        // 2. Aggiorna lo stato principale per riflettere i cambiamenti nell'UI
        setResponseData(prevData => {
            const newFields = prevData.fields.map(field => {
                if (data.updated_fields.hasOwnProperty(field.fieldid)) {
                    // Crea un nuovo oggetto field per evitare mutazioni dirette
                    return { ...field, value: data.updated_fields[field.fieldid] };
                }
                return field;
            });
            return { ...prevData, fields: newFields };
        });
      }

    } catch (error) {
      console.error('Errore durante il calcolo dei campi:', error);
      toast.error('Errore durante l\'aggiornamento dei campi calcolati.');
    } finally {
      setIsCalculating(false);
    }
  };

  // NUOVO useEffect per il DEBOUNCE
  useEffect(() => {
    // Pulisci il timeout precedente ogni volta che currentValues cambia
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Imposta un nuovo timeout
    debounceTimeoutRef.current = setTimeout(() => {
      // Chiama la funzione di calcolo dopo 500ms di inattività
      triggerCalculation(currentValues);
    }, 500);

    // Funzione di pulizia per smontare il componente
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [currentValues]); // Questo effetto si attiva ad ogni modifica

 // MODIFICATA: La logica rimane la stessa, ma ora scatena l'useEffect del debounce
  const handleInputChange = (fieldid: string, newValue: any | any[]) => {
    setUpdatedFields(prev => ({ ...prev, [fieldid]: newValue }));
  };

  //const handleInputChange = (fieldid: string, newValue: any | any[]) => {
    //isEmpty = !currentValue || currentValue === '' || (Array.isArray(currentValue) && currentValue.length === 0);
   // setUpdatedFields(prev => ({ ...prev, [fieldid]: newValue }));
  //};
  
  // NUOVA FUNZIONE: Gestisce il toggle degli accordion
  const toggleAccordion = (label: string) => {
    setOpenAccordions(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleSave = async () => {
    if (isSaveDisabled) {
      toast.warning('Compilare tutti i campi obbligatori per poter salvare.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('tableid', tableid || '');
      formData.append('recordid', recordid || '');

      const standardFields: { [key: string]: any } = {};
      Object.entries(updatedFields).forEach(([fieldId, value]) => {
        if (value instanceof File) formData.append(`files[${fieldId}]`, value);
        else standardFields[fieldId] = value;
      });

      formData.append('fields', JSON.stringify(standardFields));
      formData.append('apiRoute', 'save_record_fields');

      await axiosInstanceClient.post('/postApi', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      toast.success('Record salvato con successo');
      setUpdatedFields({});
    } catch (error) {
      console.error('Errore durante il salvataggio del record:', error);
      toast.error('Errore durante il salvataggio del record');
    } finally {
      setRefreshTable(v => v + 1);
      removeCard(tableid, recordid);
    }
  };

  const payload = useMemo(() => {
    if (isDev) return null;
    return { apiRoute: 'get_record_card_fields', tableid, recordid, mastertableid, masterrecordid };
  }, [tableid, recordid, mastertableid, masterrecordid]);

  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
    }
  }, [response, isDev, responseData]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setDelayedLoading(false), 100);
      return () => clearTimeout(timer);
    } else {
      setDelayedLoading(true);
    }
  }, [loading]);

  // NUOVA FUNZIONE: Componente riutilizzabile per renderizzare un singolo campo
  // NUOVA FUNZIONE: Componente riutilizzabile per renderizzare un singolo campo
const renderField = (field: FieldInterface) => {
    const rawValue = typeof field.value === 'object' ? field.value?.value : field.value;
    // MODIFICATO: Il valore del campo ora viene preso da currentValues per essere sempre aggiornato
    const value = currentValues[field.fieldid] ?? rawValue ?? ''; 
    const isRequired = typeof field.settings === 'object' && field.settings.obbligatorio === 'true';
    
  // Verifica se il campo obbligatorio è vuoto
  const currentValue = currentValues[field.fieldid];
  const isNewRecord = recordid === undefined || recordid === null || recordid === '';
  var isEmpty = !currentValue || currentValue === '' || (Array.isArray(currentValue) && currentValue.length === 0);
  const isRequiredEmpty = isNewRecord && isRequired && isEmpty;
  const isRequiredFilled = isNewRecord && isRequired && !isEmpty;

  

  return (
    <div key={`${field.fieldid}-container`} className="flex items-start space-x-4 w-full group">
      {/* Label con indicatori migliorati */}
      <div className="w-1/4 pt-2">
        <div className="flex items-center gap-1">
          {/* Indicatore di stato per campi obbligatori */}
          {isRequired && isNewRecord && (
            <div className={`w-1 h-4 rounded-full mr-1 ${
              isRequiredEmpty ? 'bg-red-500' : 
              isRequiredFilled ? 'bg-green-500' : ''
            }`} />
          )}
          
          <p
            data-tooltip-id="my-tooltip"
            data-tooltip-content={`${field.fieldid}${isRequired ? ' (Campo obbligatorio)' : ''}`}
            data-tooltip-place="left"
            className={`text-sm font-medium ${
              isRequired ? 'text-gray-900' : 'text-gray-700'
            }`}
          >
            {field.description}
            {isRequired && (
              <span className="text-red-600 ml-1 text-base">*</span>
            )}
          </p>
        </div>
      </div>
      
      {/* Input con bordi dinamici */}
      <div className={`w-3/4 relative transition-all duration-200 rounded-md ${
        isRequiredEmpty ? 'ring-2 ring-red-500/20' : 
        isRequiredFilled ? 'ring-2 ring-green-500/20' : ''
      }`}>
        {/* Container con stili dinamici per l'input */}
        <div className={`${
          isRequiredEmpty ? 
            '[&>*]:!border-red-400 [&>*]:!border-radius-25 [&>*]:focus:!border-red-500 [&>*]:focus:!ring-red-500/20' : 
          isRequiredFilled ? 
            '[&>*]:!border-green-400 [&>*]:focus:!border-green-500 [&>*]:focus:!ring-green-500/20' :
            ''
        }`}>
          {field.fieldtype === 'Parola' ? (
            <InputWord initialValue={value} onChange={v => handleInputChange(field.fieldid, v)} />
          ) : field.fieldtype === 'Categoria' && field.lookupitems ? (
            <SelectStandard
              lookupItems={field.lookupitems}
              initialValue={value}
              onChange={v => handleInputChange(field.fieldid, v)}
              isMulti={field.fieldtypewebid === 'multiselect'}
            />
          ) : field.fieldtype === 'Numero' ? (
            <InputNumber initialValue={value} onChange={v => handleInputChange(field.fieldid, v)} />
          ) : field.fieldtype === 'Data' ? (
            <InputDate initialValue={value} onChange={v => handleInputChange(field.fieldid, v)} />
          ) : field.fieldtype === 'Memo' ? (
            <InputMemo initialValue={value} onChange={v => handleInputChange(field.fieldid, v)} />
          ) : field.fieldtype === 'Checkbox' ? (
            <InputCheckbox initialValue={value} onChange={v => handleInputChange(field.fieldid, v)} />
          ) : field.fieldtype === 'Utente' && field.lookupitemsuser ? (
            <SelectUser
              lookupItems={field.lookupitemsuser}
              initialValue={value}
              onChange={v => handleInputChange(field.fieldid, v)}
              isMulti={field.fieldtypewebid === 'multiselect'}
            />
          ) : field.fieldtype === 'linkedmaster' ? (
            <InputLinked
              initialValue={value}
              valuecode={field.value}
              onChange={v => handleInputChange(field.fieldid, v)}
              tableid={tableid}
              linkedmaster_tableid={field.linked_mastertable}
              linkedmaster_recordid={typeof field.value === 'object' ? field.value?.code : ''}
              fieldid={field.fieldid}
              formValues={currentValues}
            />
          ) : field.fieldtype === 'LongText' ? (
            <InputEditor initialValue={value} onChange={v => handleInputChange(field.fieldid, v)} />
          ) : field.fieldtype === 'Attachment' ? (
            <InputFile
              initialValue={value ? `/api/media-proxy?url=${value}` : null}
              onChange={v => handleInputChange(field.fieldid, v)}
            />
          ) : null}
        </div>
        
        {/* Icona di stato sovrapposta */}
        {isRequired && (
          <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${
            isRequiredEmpty ? 'bg-red-500' : 
            isRequiredFilled ? 'bg-green-500' : 
            ''
          }`}>
            {isRequiredEmpty ? '!' : isRequiredFilled ? '✓' : '*'}
          </div>
        )}
      </div>
    </div>
  );
};

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="CardFields">
      {(response: ResponseInterface) => (
        <>
          <div className={'absolute inset-0 flex items-center justify-center ' + (delayedLoading ? '' : ' hidden')}>
            <LoadingComp />
          </div>
          <div className={"max-h-full flex flex-col" + (delayedLoading ? ' invisible' : '')}>
            <Tooltip id="my-tooltip" className="tooltip" />
            <div className="flex-grow overflow-y-auto max-h-[83%] space-y-3 pr-2">
              <input ref={dummyInputRef} tabIndex={-1} className="absolute opacity-0" />
              
              {/* NUOVO RENDERING: Basato sui campi raggruppati */}
              
              {/* 1. Renderizza i campi del gruppo "Dati" direttamente */}
              {groupedFields['Dati'] && (
                <div className="space-y-3">
                    {groupedFields['Dati'].map(field => renderField(field))}
                </div>
              )}

              {/* 2. Renderizza tutti gli altri gruppi come accordion */}
              {Object.keys(groupedFields).filter(label => label !== 'Dati').map(label => (
                <div key={label} className="border rounded-md overflow-hidden">
                  {/* Header dell'Accordion */}
                  <div
                    className="flex justify-between items-center p-3 bg-gray-100 cursor-pointer hover:bg-gray-200"
                    onClick={() => toggleAccordion(label)}
                  >
                    <h3 className="font-bold text-gray-700">{label}</h3>
                    <ChevronDownIcon
                      className={`w-5 h-5 text-gray-600 transition-transform transform ${openAccordions[label] ? 'rotate-180' : ''}`}
                    />
                  </div>
                  
                  {/* Contenuto dell'Accordion */}
                  {openAccordions[label] && (
                    <div className="p-4 space-y-3 bg-white">
                      {groupedFields[label].map(field => renderField(field))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottoni di salvataggio (invariati) */}
            <div className="flex-shrink-0 pt-4">
              {activeServer === 'belotti' ? (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaveDisabled}
                  className={`w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5 ${isSaveDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Conferma merce ricevuta
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaveDisabled}
                  className={`w-full theme-accent focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5 ${isSaveDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {/* NUOVO: Mostra uno stato di caricamento per il calcolo */}
                  {isCalculating ? 'Calcolo in corso...' : 'Salva'}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </GenericComponent>
  );
}