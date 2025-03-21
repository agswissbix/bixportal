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
import { forEach, update } from 'lodash';
import axiosInstance from '@/utils/axiosInstance';
import { toast } from 'sonner';

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
                        fieldid: "test6",
                        fieldorder: "6",
                        description: "Test 6",
                        value: { code: '<p>test6a</p><table><thead><tr><th><p>fwefewfwa</p></th><th><p>wfewffww</p></th><th><p><br></p></th><th><p>ewfwefwfwwef</p></th></tr></thead><tbody><tr><td><p>wefew</p></td><td><p>fwfwe</p></td><td><p>ewfe</p></td><td><p>fwef</p></td></tr><tr><td><p>wefwef</p></td><td><p>fwefewf</p></td><td><p>wewfef</p></td><td><p>wef</p></td></tr><tr><td><p>wf</p></td><td><p>wef</p></td><td><p>wef</p></td><td><p>wef</p></td></tr></tbody></table>', value: 'test6' },
                        fieldtype: "LongText",
                        lookupitems: [
                            {itemcode: '1', itemdesc: 'Item 1', link: 'item', linkfield: 'id', linkvalue: '1', linkedfield: 'id', linkedvalue: '1'},
                            {itemcode: '2', itemdesc: 'Item 2', link: 'item', linkfield: 'id', linkvalue: '2', linkedfield: 'id', linkedvalue: '2'}
                        ],
                        settings: {calcolato: 'false', default: '', nascosto: 'false', obbligatorio: 'false'}
                    },
                    {
                        tableid: "1",
                        fieldid: "test7",
                        fieldorder: "7",
                        description: "Test 7",
                        value: { code: 'test77', value: 'test7' },
                        fieldtype: "Checkbox",
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

    const handleInputChange = (fieldid: string, newValue: string | string[]) => {
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
            await axiosInstance.post('/commonapp/save_record_fields/', { tableid, recordid, fields: updatedFields });
            toast.success('Record salvato con successo');
        } catch (error) {
            console.error('Errore durante il salvataggio del record', error);
            toast.error('Errore durante iil salvataggio del record');
        }


        //reset updatedFields
        setUpdatedFields({});
        console.log("After save:", updatedFields);

        // Qui potresti fare una chiamata API per salvare i dati
        // es: api.post('/updateFields', { tableid, recordid, fields: allFields })
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
                                    <p className="text-black">{field.description}</p>
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
                                    linkedmaster_tableid={field.linked_mastertable}
                                    linkedmaster_recordid={typeof field.value === 'object' ? field.value.code : field.value}
                                />
                            ) : field.fieldtype === 'LongText' ? (
                                <InputEditor 
                                    initialValue={typeof field.value === 'object' ? field.value.code : field.value} 
                                    onChange={(value: string) => handleInputChange(field.fieldid, value)}
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
