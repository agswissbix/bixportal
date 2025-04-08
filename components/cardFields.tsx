import React, { useMemo, useContext, useState, useEffect } from 'react';
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
import { forEach, update } from 'lodash';
import axiosInstance from '@/utils/axiosInstance';
import { toast } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          tableid?: string;
          recordid?: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            fields: Array<{
                tableid: string;
                fieldid: string;
                fieldorder: string;
                description: string;
                value: string | { code: string; value: string };
                fieldtype: string;
                lookupitems?: Array<{itemcode: string, itemdesc: string, link: string, linkfield: string, linkvalue: string, linkedfield: string, linkedvalue: string}>;
                lookupitemsuser? : Array<{id: string, firstname: string, lastname: string, link: string, linkdefield: string, linkedvalue: string}>;
                fieldtypewebid?: string;
                linked_mastertable?: string;
                settings: string | {calcolato: string, default: string, nascosto: string, obbligatorio: string};
            }>,
            recordid: string;
        }

export default function CardFields({ tableid,recordid }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : tableid + '' + recordid;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                fields: [],
                recordid: '',
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                fields: [
                    {
                        tableid: "1",
                        fieldid: "test1",
                        fieldorder: "1",
                        description: "Test 1",
                        value: { code: '00000000000000000000000000000415', value: 'test1' },
                        fieldtype: "linkedmaster",
                        linked_mastertable: "contact",
                        settings: {calcolato: 'false', default: '', nascosto: 'false', obbligatorio: 'false'}
                    },
                    {
                        tableid: "1",
                        fieldid: "test2",
                        fieldorder: "2",
                        description: "Test 2",
                        value: { code: '2', value: '2' },
                        fieldtype: "Numero",
                        settings: {calcolato: 'false', default: '', nascosto: 'false', obbligatorio: 'false'}
            
                    },
                    {
                        tableid: "1",
                        fieldid: "test3",
                        fieldorder: "3",
                        description: "Test 3",
                        value: { code: '2024-10-30', value: '30/10/2024' },
                        fieldtype: "Data",
                        settings: {calcolato: 'false', default: '', nascosto: 'false', obbligatorio: 'false'}
            
                    },
                    {
                        tableid: "1",
                        fieldid: "test4",
                        fieldorder: "4",
                        description: "Test 4",
                        value: { code: 'test4', value: 'test4' },
                        fieldtype: "Memo",
                        settings: {calcolato: 'false', default: '', nascosto: 'false', obbligatorio: 'false'}
            
                    },
                    {
                        tableid: "1",
                        fieldid: "test5",
                        fieldorder: "5",
                        description: "Test 5",
                        value: { code: 'test5', value: 'test5' },
                        fieldtype: "Utente",
                        lookupitemsuser: [
                            {id: '1', firstname: 'Mario', lastname: 'Rossi', link: 'user', linkdefield: 'id', linkedvalue: '1'},
                            {id: '2', firstname: 'Luca', lastname: 'Bianchi', link: 'user', linkdefield: 'id', linkedvalue: '2'},
                            {id: '3', firstname: 'Mario', lastname: 'Rossi', link: 'user', linkdefield: 'id', linkedvalue: '3'},
                            {id: '4', firstname: 'Mario', lastname: 'Rossi', link: 'user', linkdefield: 'id', linkedvalue: '4'},
                            {id: '5', firstname: 'Mario', lastname: 'Rossi', link: 'user', linkdefield: 'id', linkedvalue: '5'},
            
            
            
                        ],
                        fieldtypewebid: "multiselect",
                        settings: {calcolato: 'false', default: '', nascosto: 'false', obbligatorio: 'false'}
            
                    },

                    {
                        tableid: "1",
                        fieldid: "test7",
                        fieldorder: "7",
                        description: "Test 7",
                        value: { code: 'test77', value: 'test7' },
                        fieldtype: "Attachment",
                        settings: {calcolato: 'false', default: '', nascosto: 'false', obbligatorio: 'false'}
                    }
                ],
                recordid: "0000"
            };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);
    const [updatedFields, setUpdatedFields] = useState<{ [key: string]: string | string[] }>({});

    const handleInputChange = (fieldid: string, newValue: any | any[]) => {
        setUpdatedFields(prev => {
            // Controlla se il valore è effettivamente cambiato prima di aggiornare lo stato
            if (prev[fieldid] === newValue) {
                return prev; // Non fare nulla se il valore è uguale
            }
            return {
                ...prev,
                [fieldid]: newValue,
            };
        });
    };
    
    
      const handleSave = async () => {
        console.log("Tutti i campi aggiornati:", updatedFields);
        try {
            const formData = new FormData();
            formData.append('tableid', tableid || '');
            formData.append('recordid', recordid || '');
            
            // Separa i file dagli altri campi
            const standardFields: { [key: string]: any } = {};
            
            Object.entries(updatedFields).forEach(([fieldId, value]) => {
                if (value instanceof File) {
                    formData.append(`files[${fieldId}]`, value);
                } else {
                    standardFields[fieldId] = value;
                }
            });
            
            // Aggiungi i campi standard come JSON
            formData.append('fields', JSON.stringify(standardFields));
            formData.append('apiRoute', 'save_record_fields');

            console.log(formData)   
            console.log("axiosInstanceClient:save_record_fields")
            await axiosInstanceClient.post('/postApi', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                });
            
            toast.success('Record salvato con successo');
            setUpdatedFields({});
        } catch (error) {
            console.error('Errore durante il salvataggio del record:', error);
            toast.error('Errore durante il salvataggio del record');
        }
    };
    


    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_record_card_fields', // riferimento api per il backend
            tableid: tableid,
            recordid: recordid,
        };
    }, [tableid,recordid]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };


    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non toccare)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response); // Questo aggiorna solo quando c'è una differenza nei dati
        }
    }, [response, isDev, responseData]); // Assicurati che le dipendenze siano ben definite
    

    return (
        <GenericComponent response={responseData} loading={loading} error={error} title="CardFields"> 
            {(response: ResponseInterface) => (
                <div className="h-full">
                    <div className="h-full flex flex-row overflow-y-scroll">
                        {/* COLONNA DEI FIELD (ETICHETTE) */}
                        <div className="h-full flex flex-2 flex-col space-y-3">
                            {response.fields.map(field => (
                                <div className="py-2 flex items-center h-10" key={field.fieldid}>
                                    <p className="text-black">{field.description} {field.linked_mastertable}</p>
                                </div>  
                            ))}
                        </div>
                        
                        {/* COLONNA DEI VALORI (INPUT) */}
                        <div className="h-full ml-6 flex flex-auto flex-col space-y-3">
                            {response.fields.map(field => (
                                <div key={field.fieldid} className="w-full py-2 items-center h-10">
                            {field.fieldtype === 'Parola' ? (
                                <InputWord 
                                    initialValue={typeof field.value === 'object' ? field.value.code : field.value} 
                                    onChange={(value: string) => handleInputChange(field.fieldid, value)} 
                                />
                            ) : field.fieldtype === 'Numero' ? (
                                <InputNumber 
                                    initialValue={typeof field.value === 'object' ? field.value.code : field.value} 
                                    onChange={(value: string) => handleInputChange(field.fieldid, value)} 
                                />
                            ) : field.fieldtype === 'Data' ? (
                                <InputDate 
                                    initialValue={typeof field.value === 'object' ? field.value.code : field.value} 
                                    onChange={(value: string) => handleInputChange(field.fieldid, value)} 
                                />
                            ) : field.fieldtype === 'Memo' ? (
                                <InputMemo 
                                    initialValue={typeof field.value === 'object' ? field.value.code : field.value} 
                                    onChange={(value: string) => handleInputChange(field.fieldid, value)} 
                                />
                            ) : field.fieldtype === 'Checkbox' ? (
                                <InputCheckbox 
                                    initialValue={typeof field.value === 'object' ? field.value.code : field.value} 
                                    onChange={(value: string) => handleInputChange(field.fieldid, value)} 
                                /> 
                            ) : field.fieldtype === 'Utente' && field.lookupitemsuser ? (
                                <SelectUser
                                  lookupItems={field.lookupitemsuser}
                                  initialValue={typeof field.value === 'object' ? field.value.code : field.value}
                                  onChange={(value: string) => handleInputChange(field.fieldid, value)}
                                  isMulti={field.fieldtypewebid === 'multiselect'}
                                />
                            ) : field.fieldtype === 'Categoria' && field.lookupitems ? (
                                <SelectStandard
                                    lookupItems={field.lookupitems.map(item => ({
                                    itemcode: item.itemcode,
                                    itemdesc: item.itemdesc,
                                    }))}
                                    initialValue={typeof field.value === 'object' ? field.value.code : field.value}
                                    onChange={(value: string) => handleInputChange(field.fieldid, value)}
                                />
                            ) : field.fieldtype === 'linkedmaster' ? (
                                <InputLinked 
                                    initialValue={typeof field.value === 'object' ? field.value.code : field.value} 
                                    onChange={(value: string) => handleInputChange(field.fieldid, value)}
                                    tableid={tableid}
                                    linkedmaster_tableid={field.linked_mastertable}
                                    linkedmaster_recordid={typeof field.value === 'object' ? field.value.code : field.value}
                                    fieldid={field.fieldid}
                                />
                            ) : field.fieldtype === 'LongText' ? (
                                <InputEditor 
                                    initialValue={typeof field.value === 'object' ? field.value.code : field.value} 
                                    onChange={(value: string) => handleInputChange(field.fieldid, value)}
                                />
                            ) : field.fieldtype === 'Attachment' ? (
                                <InputFile
                                    initialValue={field.value as unknown as File}
                                    onChange={(value: File | null) => handleInputChange(field.fieldid, value)} 
                                />
                            ) : null}
                        </div>
                    ))}

                    </div>
                </div>
                <button type="button" onClick={handleSave} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5 me-2 mt-4">
                    Salva
                </button>                
            </div>
            )}
        </GenericComponent>
    );
};
