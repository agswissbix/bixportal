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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

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
                        value: { code: 'test6', value: 'test6' },
                        fieldtype: "Categoria",
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


    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'examplepost', // riferimento api per il backend
            tableid: tableid,
            recordid: recordid,
        };
    }, [tableid,recordid]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    const handleInputChange = (fieldid: string, newValue: string | string[]) => {
        //setComponentData(prevState => ({
          //  fields: prevState.fields.map(field =>
            //    field.fieldid === fieldid ? { ...field, value: newValue } : field
           // )
        //}));
    };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non toccare)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
                <div className="h-5/6">
                <div className="h-full flex flex-row overflow-y-scroll">
                    <div className="flex-1 flex flex-col ">
                        {response.fields.map(field => (
                            <div className="flex-1" key={field.fieldid}>
                                <p className="text-black">{field.description}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 flex flex-col">
                    {response.fields.map(field => (
                        <div key={field.fieldid} className="flex-1">
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
                              ) : null}
                        </div>
                    ))}

                    </div>
                </div>
                
            </div>
            )}
        </GenericComponent>
    );
};
