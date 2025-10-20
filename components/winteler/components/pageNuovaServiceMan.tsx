import React, { useMemo, useContext, useState, useEffect, useRef } from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "../../genericComponent";
import { AppContext } from "@/context/appContext";
import GeneralButton from "./generalButton";
import FloatingLabelInput from "./floatingLabelInput";
import Image from "next/image";
import axiosInstanceClient from "@/utils/axiosInstanceClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
// INTERFACCIA PROPS
interface PropsInterface {
    propExampleValue?: string;
}

interface ServiceMan {
    nome: string;
    cognome: string;
    telefono: string;
    email: string;
    targa: string;
    telaio: string;
    modello: string;
    data: Date;
    utente: string;
    foto: File[];
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
    serviceMan: ServiceMan;
}

const formatDateForInput = (date: Date | null): string => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
};

const formatTimeForInput = (date: Date | null): string => {
    if (!date) return "";
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
};

export default function PageNuovaServiceMan({
    propExampleValue,
}: PropsInterface) {
    //DATI
    // DATI PROPS PER LO SVILUPPO
    const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
        serviceMan: {
            nome: "",
            cognome: "",
            telefono: "",
            email: "",
            targa: "",
            telaio: "",
            modello: "",
            data: null,
            utente: "",
            foto: [],
        },
    };

    // DATI RESPONSE PER LO SVILUPPO
    const responseDataDEV: ResponseInterface = {
        serviceMan: {
            nome: "",
            cognome: "",
            telefono: "",
            email: "",
            targa: "",
            telaio: "",
            modello: "",
            data: null,
            utente: "",
            foto: [],
        },
    };

    // DATI DEL CONTESTO
    const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(
        isDev ? responseDataDEV : responseDataDEFAULT
    );

    const [fotoPreview, setFotoPreview] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: "examplepost", // riferimento api per il backend
            example1: propExampleValue,
        };
    }, [propExampleValue]);

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

    const openPage = (route) => {};

    const handleChange = (path: string, value: any) => {
        setResponseData((prev) => {
            const newState = { ...prev };

            if (path === "data") {
                const existingDate = prev.serviceMan.data
                    ? new Date(prev.serviceMan.data)
                    : new Date();

                if (typeof value === "string" && value.includes("-")) {
                    const [year, month, day] = value.split("-").map(Number);
                    existingDate.setFullYear(year, month - 1, day);
                } else if (typeof value === "string" && value.includes(":")) {
                    const [hours, minutes] = value.split(":").map(Number);
                    existingDate.setHours(hours, minutes, 0, 0);
                }

                newState.serviceMan.data = existingDate;
            } else {
                const keys = path.split(".");
                let currentLevel: any = newState.serviceMan;
                for (let i = 0; i < keys.length - 1; i++) {
                    currentLevel = currentLevel[keys[i]] = {
                        ...currentLevel[keys[i]],
                    };
                    currentLevel = currentLevel[keys[i]];
                }
                currentLevel[keys[keys.length - 1]] = value;
            }

            return newState;
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;

        if (files && files.length > 0) {
            const newFiles = Array.from(files);

            setResponseData((prev) => ({
                ...prev,
                serviceMan: {
                    ...prev.serviceMan,
                    foto: [...prev.serviceMan.foto, ...newFiles],
                },
            }));

            const newPreviewUrls = newFiles.map((file) =>
                URL.createObjectURL(file)
            );

            setFotoPreview((prev) => [...prev, ...newPreviewUrls]);
        }
    };

    const caricaFoto = (): void => {
        fileInputRef.current?.click();
    };

    const rimuoviFoto = (indexToRemove: number) => {
        URL.revokeObjectURL(fotoPreview[indexToRemove]);

        setResponseData((prev) => ({
            ...prev,
            serviceMan: {
                ...prev.serviceMan,
                foto: prev.serviceMan.foto.filter(
                    (_, index) => index !== indexToRemove
                ),
            },
        }));

        setFotoPreview((prev) =>
            prev.filter((_, index) => index !== indexToRemove)
        );

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        return () => {
            fotoPreview.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [fotoPreview]);

    const handleSubmit = (event: React.FormEvent) => {
        saveServiceMan(responseData.serviceMan);
    };

    async function saveServiceMan({
        nome,
        cognome,
        telefono,
        email,
        targa,
        telaio,
        modello,
        data,
        utente,
    }: ServiceMan) {
        try {
            const response = await axiosInstanceClient.post(
                "/postApi",
                {
                    apiRoute: "save_service_man",
                    nome,
                    cognome,
                    telefono,
                    email,
                    targa,
                    telaio,
                    modello,
                    data,
                    utente,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <GenericComponent
            response={responseData}
            loading={loading}
            error={error}>
            {(response: ResponseInterface) => (
                <div className="flex items-start justify-center p-0 sm:p-4 overflow-y-auto max-h-screen">
                    <div className="overflow-hidden bg-white shadow-md border border-gray-200">
                        <div className="w-full flex flex-col justify-center items-center p-4">
                            <Image
                                src="/bixdata/logos/winteler.png"
                                alt="Logo Winteler"
                                width={400}
                                height={200}
                                className="w-full h-auto"
                            />
                        </div>

                        <div className="w-full flex flex-col justify-center p-5 mb-8">
                            <form
                                onSubmit={handleSubmit}
                                className="w-full">
                                <div className="p-4">
                                    <div className="mb-8">
                                        <FloatingLabelInput
                                            id="nome"
                                            name="nome"
                                            label="Nome cliente"
                                            value={response.serviceMan.nome}
                                            onChange={(e) =>
                                                handleChange(
                                                    "nome",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="cognome"
                                            name="cognome"
                                            label="Cognome cliente"
                                            value={response.serviceMan.cognome}
                                            onChange={(e) =>
                                                handleChange(
                                                    "cognome",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="telefono"
                                            name="telefono"
                                            label="Telefono"
                                            value={response.serviceMan.telefono}
                                            onChange={(e) =>
                                                handleChange(
                                                    "telefono",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="email"
                                            name="email"
                                            label="Email"
                                            type="email"
                                            value={response.serviceMan.email}
                                            onChange={(e) =>
                                                handleChange(
                                                    "email",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="targa"
                                            name="targa"
                                            label="Targa"
                                            value={response.serviceMan.targa}
                                            onChange={(e) =>
                                                handleChange(
                                                    "targa",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="telaio"
                                            name="telaio"
                                            label="Telaio"
                                            value={response.serviceMan.telaio}
                                            onChange={(e) =>
                                                handleChange(
                                                    "telaio",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="modello"
                                            name="modello"
                                            label="Modello"
                                            value={response.serviceMan.modello}
                                            onChange={(e) =>
                                                handleChange(
                                                    "modello",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="data"
                                            name="data"
                                            label="Data"
                                            type="date"
                                            value={formatDateForInput(
                                                response.serviceMan.data
                                            )}
                                            onChange={(e) =>
                                                handleChange(
                                                    "data",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="ora"
                                            name="ora"
                                            label="Ora "
                                            type="time"
                                            value={formatTimeForInput(
                                                response.serviceMan.data
                                            )}
                                            onChange={(e) =>
                                                handleChange(
                                                    "data",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="utente"
                                            name="utente"
                                            label="Utente"
                                            value={response.serviceMan.utente}
                                            onChange={(e) =>
                                                handleChange(
                                                    "utente",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    {fotoPreview.length > 0 && (
                                        <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {fotoPreview.map(
                                                (previewUrl, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative flex flex-col items-center">
                                                        <Image
                                                            src={previewUrl}
                                                            alt={`Anteprima ${
                                                                index + 1
                                                            }`}
                                                            width={150}
                                                            height={150}
                                                            className="object-contain border border-gray-300 rounded"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                rimuoviFoto(
                                                                    index
                                                                )
                                                            }
                                                            className="mt-2 text-sm text-red-600 hover:text-red-800">
                                                            Rimuovi
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                    />

                                    <GeneralButton
                                        text={
                                            response.serviceMan.foto.length > 0
                                                ? "Aggiungi Foto"
                                                : "Carica Foto"
                                        }
                                        className="mb-4"
                                        action={caricaFoto}
                                        type="button"
                                    />

                                    <GeneralButton
                                        type="submit"
                                        text="salva"
                                        className="mb-4"
                                    />
                                </div>
                            </form>
                            <GeneralButton
                                text="menu"
                                action={() => openPage("/menu")}
                            />
                        </div>
                    </div>
                </div>
            )}
        </GenericComponent>
    );
}
