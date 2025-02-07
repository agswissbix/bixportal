import React, { useMemo,useContext,useState,useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';


interface PropsInterface {
  propExampleValue?: string;
}

interface ResponseInterface {
  responseExampleValue: string;
}

// RESPONSE DI DEFAULT
const responseDataDEFAULT: ResponseInterface = {
  responseExampleValue: ""
};

// RESPONSE DI ESEMPIO PER LO SVILUPPO
const responseDataDEV: ResponseInterface = {
  responseExampleValue: "Example"
};

const ExampleComponentWithData: React.FC<PropsInterface> = ({ propExampleValue }) => {
    //Dati dall'appContext
    const { user } = useContext(AppContext);

    //Dati da usare nel componente
    const [responseData, setResponseData] = useState<ResponseInterface>(responseDataDEFAULT);

    // Dati da inviare al backend
    const payload = useMemo(() => ({
        apiRoute: 'examplepost', // riferimento api per il backend
        payloadExampleValue: propExampleValue
    }), [propExampleValue]);

    
    // Dati di risposta dal backend
    const { response, loading, error } = useApi<ResponseInterface>(payload);
    useEffect(() => {
        if (response) {
          setResponseData(response);
        }
    }, [response]);
    

    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(data: ResponseInterface) => (
                <div>
                    propExampleValue: {propExampleValue}
                    <br/>
                    responseExampleValue: {data.responseExampleValue}
                    <br/>
                    <p>Utente loggato (da context): {user ?? 'Nessun utente'}</p>
                </div>
            )}
        </GenericComponent>

    );
};

export default ExampleComponentWithData;
