import React, { useMemo, useContext, useState, useEffect } from "react";
import { useApi } from "@/utils/useApi";
import { AppContext } from "@/context/appContext";
import GenericComponent from "@/components/genericComponent";
import GeneralButton from "./generalButton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
}

export default function ExampleComponent({ onChangeView }) {
    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
    };

    // DATI RESPONSE PER LO SVILUPPO
    const responseDataDEV: ResponseInterface = {

    };

    // DATI DEL CONTESTO
    const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(
        isDev ? responseDataDEV : responseDataDEFAULT
    );

    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: "examplepost", // riferimento api per il backend
        };
    }, []);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error, elapsedTime } =
        !isDev && payload
            ? useApi<ResponseInterface>(payload)
            : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        if (
            !isDev &&
            response &&
            JSON.stringify(response) !== JSON.stringify(responseData)
        ) {
            setResponseData(response);
        }
    }, [response, responseData]);

    // PER DEVELLOPMENT
    useEffect(() => {
        setResponseData({ ...responseDataDEV });
    }, []);

    const openPage = (route) => {
        onChangeView(route);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
    };



    return (
        <GenericComponent
            response={responseData}
            loading={loading}
            error={error}>
            {(response: ResponseInterface) => (
                <div className="w-full flex flex-col justify-center p-5 mb-8">
                    
                    <GeneralButton
                        text="menu"
                        action={() => openPage("menu")}
                    />
                </div>
            )}
        </GenericComponent>
    );
}
