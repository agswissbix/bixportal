"use client"

import { useEffect, useState, useMemo, use } from "react";
import { CheckCircle, Home, AlertCircle } from "lucide-react";
import {useApi} from "@/utils/useApi";
import GenericComponent from "@/components/genericComponent";
import { useRecordsStore } from "@/components/records/recordsStore";
import { useRouter } from "next/navigation";

const isDev = false


interface ResponseInterface {
	message: string
	record: any
}

const responseDefault: ResponseInterface = {
	message: "",
	record: {}
}

export default function BelottiPage(props: { params: { recordId: string } }) {
  const unwrappedParams = use(props.params); 
  const { recordId } = unwrappedParams;

const { setSelectedMenu } = useRecordsStore();

  const router = useRouter();


  const [responseData, setResponseData] = useState<ResponseInterface>(responseDefault);

  const payload = useMemo(() => {
		if (isDev) return null;
		return { 
			apiRoute: 'belotti_conferma_ricezione',
			recordid_hashed: recordId
		};
	}, [recordId]);
  
	const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };
	
	useEffect(() => {
			if (!isDev && response) { 
				console.log("Response received:", response);
				setResponseData(response); 
			}
	}, [response]);

  
	const handleBackHome = () => {
		setSelectedMenu("richieste");
		router.push("/home");
	};

  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
				<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-6"></div>
                <h2 className="text-2xl font-semibold text-gray-700">Elaborazione in corso...</h2>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-12 h-12 text-red-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Errore</h1>
                <p className="text-lg text-gray-600 mb-8">
                  Si è verificato un errore durante il salvataggio. Ti preghiamo di riprovare.
                </p>
                <button
                  onClick={() => setSelectedMenu("richieste")}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Home className="w-5 h-5" />
                  Torna alla Home
                </button>
              </div>
            )}

            {/* Success State */}
            {!loading && !error && (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center transform transition-all duration-500 hover:shadow-2xl">
                {/* Success Icon */}
                <div className="bg-emerald-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <CheckCircle className="w-16 h-16 text-emerald-600" />
                </div>

                {/* Title */}
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                  Conferma Ricezione
                </h1>

                {/* Message */}
                <div className="bg-emerald-50 rounded-xl p-6 mb-8">
                  <p className="text-xl text-emerald-800 font-medium">
                    {response.message || "Operazione completata con successo"}
                  </p>
                </div>

                {/* Record Details */}
                {/* {response.record && Object.keys(response.record).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Dettagli Operazione
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(response.record).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-0">
                          <span className="text-sm font-medium text-gray-600 capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="text-sm text-gray-800 font-mono">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}

                {/* Home Button */}
                <button
                  onClick={handleBackHome}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Home className="w-5 h-5" />
                  Torna alla Home
                </button>

                {/* Success Message Footer */}
                <p className="text-sm text-gray-500 mt-8">
                  I tuoi dati sono stati salvati correttamente nel sistema
                </p>
              </div>
            )}
          </div>
        </div>
		)}
	</GenericComponent>
  );
}
