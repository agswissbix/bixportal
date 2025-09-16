'use client';

import React, { useMemo, useContext, useState, useEffect, useRef, use } from 'react';
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

const isDev = false;

interface PropsInterface {
  tableid: string;
  recordid: string;
  mastertableid?: string;
  masterrecordid?: string;
}

interface ResponseInterface {
  fields: Array<{
    tableid: string;
    fieldid: string;
    fieldorder: string;
    description: string;
    value: string | { code: string; value: string };
    fieldtype: string;
    lookupitems?: Array<{ itemcode: string; itemdesc: string }>;
    lookupitemsuser?: Array<{ userid: string; firstname: string; lastname: string; link: string; linkdefield: string; linkedvalue: string }>;
    fieldtypewebid?: string;
    linked_mastertable?: string;
    settings: string | { calcolato: string; default: string; nascosto: string; obbligatorio: string };
    isMulti?: boolean;
  }>;
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

  const { removeCard, addCard, refreshTable, setRefreshTable } = useRecordsStore();

  const currentValues = useMemo(() => {
    const obj: Record<string, any> = {};
    responseData?.fields.forEach(f => {
      const backendValue =
        typeof f.value === 'object' ? (f.value as any).code ?? (f.value as any).value : f.value;
      obj[f.fieldid] = updatedFields.hasOwnProperty(f.fieldid) ? updatedFields[f.fieldid] : backendValue ?? '';
    });
    return obj;
  }, [responseData, updatedFields]);

  useEffect(() => {
    const requiredFields = responseData?.fields.filter(
      field => typeof field.settings === 'object' && field.settings.obbligatorio === 'true'
    ) || [];

    if (requiredFields.length === 0) {
      setIsSaveDisabled(false);
      return;
    }

    const allRequiredFilled = requiredFields.every(field => {
      const value = currentValues[field.fieldid];
      return value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);
    });

    setIsSaveDisabled(!allRequiredFilled);
  }, [currentValues, responseData?.fields]);

  const handleInputChange = (fieldid: string, newValue: any | any[]) => {
    setUpdatedFields(prev => (prev[fieldid] === newValue ? prev : { ...prev, [fieldid]: newValue }));
  };

  const handleSave = async () => {
    if (isSaveDisabled) {
      toast.warning('Compilare tutti i campi obbligatori per poter salvare');
      return;
    }

    let newRecordId: string | null = null;
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

      const saveResponse = await axiosInstanceClient.post('/postApi', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      newRecordId = saveResponse?.data?.recordid;

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
  }, [tableid, recordid]);

  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
    }
  }, [response, isDev, responseData]);

  useEffect(() => {
    if (!loading) {
        // aggiunge 100ms di delay dopo il loading
        const timer = setTimeout(() => setDelayedLoading(false), 100);
        return () => clearTimeout(timer);
    } else {
        // se loading diventa true di nuovo, resetta il delayedLoading
        setDelayedLoading(true);
    }
	}, [loading]);

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="CardFields">
      {(response: ResponseInterface) => (
				<>
					<div className={'absolute inset-0 flex items-center justify-center ' + (delayedLoading ? '' : ' hidden')}>
						<LoadingComp />
					</div>
					<div className={"h-full" + (delayedLoading ? ' invisible' : '')}>
						<Tooltip id="my-tooltip" className="tooltip" />
						<div className="h-full flex flex-col overflow-y-scroll space-y-3">
							
							{/* Input fittizio con focus */}
							<input ref={dummyInputRef} tabIndex={0} 
									className="text-transparent bg-transparent border-0 h-0" readOnly aria-hidden="true"
							/>

							{response.fields.map(field => {
								const rawValue = typeof field.value === 'object' ? field.value?.value : field.value;
								const initialValue = rawValue ?? '';
								const isRequired = typeof field.settings === 'object' && field.settings.obbligatorio === 'true';

								return (
									<div key={`${field.fieldid}-container`} className="flex items-center space-x-4 w-full">
										<div className="w-1/4">
											<p
												data-tooltip-id="my-tooltip"
												data-tooltip-content={field.fieldid}
												data-tooltip-place="left"
												className={`text-black font-semibold ${isRequired ? 'text-red-700' : 'bg-transparent'}`}
											>
												{field.description}
											</p>
										</div>

										<div className="w-3/4">
											{field.fieldtype === 'Parola' ? (
												<InputWord initialValue={initialValue} onChange={v => handleInputChange(field.fieldid, v)} />
											) : field.fieldtype === 'Categoria' && field.lookupitems ? (
												<SelectStandard
													lookupItems={field.lookupitems}
													initialValue={initialValue}
													onChange={v => handleInputChange(field.fieldid, v)}
													isMulti={field.fieldtypewebid === 'multiselect'}
												/>
											) : field.fieldtype === 'Numero' ? (
												<InputNumber initialValue={initialValue} onChange={v => handleInputChange(field.fieldid, v)} />
											) : field.fieldtype === 'Data' ? (
												<InputDate initialValue={initialValue} onChange={v => handleInputChange(field.fieldid, v)} />
											) : field.fieldtype === 'Memo' ? (
												<InputMemo initialValue={initialValue} onChange={v => handleInputChange(field.fieldid, v)} />
											) : field.fieldtype === 'Checkbox' ? (
												<InputCheckbox initialValue={initialValue} onChange={v => handleInputChange(field.fieldid, v)} />
											) : field.fieldtype === 'Utente' && field.lookupitemsuser ? (
												<SelectUser
													lookupItems={field.lookupitemsuser}
													initialValue={initialValue}
													onChange={v => handleInputChange(field.fieldid, v)}
													isMulti={field.fieldtypewebid === 'multiselect'}
												/>
											) : field.fieldtype === 'linkedmaster' ? (
												<InputLinked
													initialValue={initialValue}
													valuecode={field.value}
													onChange={v => handleInputChange(field.fieldid, v)}
													tableid={tableid}
													linkedmaster_tableid={field.linked_mastertable}
													linkedmaster_recordid={field.value?.code || ''}
													fieldid={field.fieldid}
													formValues={currentValues}
												/>
											) : field.fieldtype === 'LongText' ? (
												<InputEditor initialValue={initialValue} onChange={v => handleInputChange(field.fieldid, v)} />
											) : field.fieldtype === 'Attachment' ? (
												<InputFile
													initialValue={initialValue ? `/api/media-proxy?url=${initialValue}` : null}
													onChange={v => handleInputChange(field.fieldid, v)}
												/>
											) : null}
										</div>
									</div>
								);
							})}
						</div>

						{/* Bottoni di salvataggio */}
						{activeServer === 'belotti' ? (
							<button
								type="button"
								onClick={handleSave}
								className={`text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5 me-2 mt-4 ${isSaveDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
							>
								Conferma merce ricevuta
							</button>
						) : (
							<button
								type="button"
								onClick={handleSave}
								className={`theme-accent focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5 me-2 mt-4 ${isSaveDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
							>
								Salva
							</button>
						)}
					</div>
				</>
      )}
    </GenericComponent>
  );
}
