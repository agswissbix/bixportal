import React, { useMemo, useContext, useState, useEffect } from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "../../../genericComponent";
import { AppContext } from "@/context/appContext";
import GeneralButton from "../generalButton";
import FloatingLabelInput from "../floatingLabelInput";
import BarcodeScanner from "../barcodeScanner";
import axiosInstanceClient from "@/utils/axiosInstanceClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;


interface Auto {
    barcode: string;
    telaio: string;
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
    auto: Auto;
}

export default function SchedaAuto({onChangeView}) {
    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
        auto: {
            barcode: "",
            telaio: "",
        },
    };

    // DATI RESPONSE PER LO SVILUPPO
    const responseDataDEV: ResponseInterface = {
        auto: {
            barcode: "",
            telaio: "",
        },
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

    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState(null);

    const [searchError, setSearchError] = useState<string | null>(null);


    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value, type } = e.target;

        setResponseData((prevData) => {
            let processedValue: string | number | boolean = value;

            if (type === "number") {
                processedValue = parseInt(value) || 0;
            } else if (type === "checkbox") {
                const isChecked = (e.target as HTMLInputElement).checked;
                processedValue = isChecked ? "Si" : "No";
            } else {
                processedValue = value;
            }

            return {
                ...prevData,
                auto: {
                    ...prevData.auto,
                    [name]: processedValue as any,
                },
            };
        });
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        searchSchedaAuto(responseData.auto);
    };

    async function searchSchedaAuto({ barcode, telaio }: Auto) {
        setSearchError(null);

        if (!barcode.trim() && !telaio.trim()) {
            setSearchError("Inserisci un Barcode o un Telaio.");
            return;
        }

        try {
            const response = await axiosInstanceClient.post(
                "/postApi",
                {
                    apiRoute: "search_scheda_auto",
                    barcode,
                    telaio,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.status === 200) {
                const schedaId = response.data.scheda_auto?.id;

                if (schedaId) {
                    onChangeView("scheda-dettagli-auto", { id: schedaId });
                } else {
                    setSearchError("Risposta del server non valida.");
                }
            }
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                const errorMessage =
                    error.response.data?.messaggio || "Errore sconosciuto.";

                if (status === 400) {
                    setSearchError(`Errore di input: ${errorMessage}`);
                } else if (status === 404) {
                    setSearchError(`Scheda non trovata`);
                } else {
                    setSearchError(
                        "Si è verificato un errore del server. Riprova più tardi."
                    );
                }
            } else {
                setSearchError(
                    "Impossibile connettersi al server. Controlla la tua connessione."
                );
            }
        }
    }

    const handleScanSuccess = (decodedText, decodedResult) => {
        console.log(`Codice scansionato: ${decodedText}`, decodedResult);

        setResponseData((prevData) => ({
            ...prevData,
            auto: {
                ...prevData.auto,
                barcode: decodedText,
            },
        }));

        setScanResult(decodedText);
        setScanError(null);
    };

    const handleScanError = (errorMessage) => {
        console.error("Errore di scansione:", errorMessage);
        if (scanError) {
            setScanError(errorMessage);
        }
    };

    return (
        <GenericComponent
            response={responseData}
            loading={loading}
            error={error}>
            {(response: ResponseInterface) => (
                <div className="w-full flex flex-col justify-center p-5 mb-8">
                    <form
                        onSubmit={handleSubmit}
                        className="w-full">
                        <div className="p-4">
                            {searchError && (
                                <div className="text-center p-4 mb-4 bg-red-50 border border-red-200">
                                    <p className="text-sm text-gray-800">
                                        {searchError}
                                    </p>
                                </div>
                            )}

                            {/* QR Code reader */}
                            <BarcodeScanner
                                onScanSuccess={handleScanSuccess}
                                onScanError={handleScanError}
                            />

                            <div className="mb-8 mt-8">
                                <FloatingLabelInput
                                    id="barcode"
                                    name="barcode"
                                    label="Barcode"
                                    value={response.auto.barcode}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="mb-8">
                                <FloatingLabelInput
                                    id="telaio"
                                    name="telaio"
                                    label="Telaio"
                                    value={response.auto.telaio}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <GeneralButton
                            type="submit"
                            text="avanti"
                            className="mb-4"
                        />
                    </form>
                    <GeneralButton
                        text="menu"
                        action={() => openPage("menu")}
                    />
                </div>
            )}
        </GenericComponent>
    );
}
