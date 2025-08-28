import { Card, CardContent } from "@/components/ui/card"
import { Mail, Phone, Building2, CreditCard } from "lucide-react"
import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import { AppContext } from '@/context/appContext';
import GenericComponent from '@/components/genericComponent';
	
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
				// INTERFACCIA PROPS
				interface PropsInterface {
					propExampleValue?: string;
				}

				// INTERFACCIA RISPOSTA DAL BACKEND
				interface ResponseInterface {
					cliente: {
						nome: string;
						indirizzo: string;
						citta: string;
					}
				}

export default function CompanyHeader({propExampleValue}: PropsInterface) {
	//DATI
					// DATI PROPS PER LO SVILUPPO
					const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

					// DATI RESPONSE DI DEFAULT
					const responseDataDEFAULT: ResponseInterface = {
							cliente: {
								nome: "Farmacia MGM Azione Sagl",
								indirizzo: "Via Franco Zorzi 36a",
								citta: "Bellinzona"
							}
						};

					// DATI RESPONSE PER LO SVILUPPO 
					const responseDataDEV: ResponseInterface = {
						cliente: {
							nome: "Farmacia MGM Azione Sagl",
							indirizzo: "Via Franco Zorzi 36a",
							citta: "Bellinzona"
						}
					};

					// DATI DEL CONTESTO
					const { user } = useContext(AppContext);

	// IMPOSTAZIONE DELLA RESPONSE (non toccare)
	const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);


	// PAYLOAD (solo se non in sviluppo)
	const payload = useMemo(() => {
			if (isDev) return null;
			return {
					apiRoute: 'get_activemind', // riferimento api per il backend
					example1: propExampleValue
			};
	}, [propExampleValue]);

	// CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
	const { response, loading, error, elapsedTime } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

	// AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
	useEffect(() => {
			if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
					setResponseData(response);
			}
	}, [response, responseData]);

	// PER DEVELOPMENT 
	useEffect(() => {
			const interval = setInterval(() => {
					// forza un setState con lo stesso valore, quindi re-render inutile
					setResponseData({ 
						cliente: {
							nome: "Farmacia MGM Azione Sagl",
							indirizzo: "Via Franco Zorzi 36a",
							citta: "Bellinzona"
						} 
					}); // stesso valore di prima

			}, 3000);
			return () => clearInterval(interval);
	}, []);

  return (
		<GenericComponent response={responseData} loading={loading} error={error}> 
			{(response: ResponseInterface) => (
				<>
				{/* Service Title */}
				<div className="mt-6 text-center">
					<h1 className="text-4xl font-bold text-gray-900">Servizi di supporto sistemistico ActiveMind</h1>
					<p className="text-gray-600 mt-2">Intervento tecnico di manutenzione informatica</p>
					<div className="mt-2 text-xs text-gray-500">Massagno, {new Date().toLocaleDateString("it-IT")}</div>
				</div>
				<Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 print:bg-white print:border-gray-300">
					<CardContent className="p-6">
						<div className="grid md:grid-cols-2 gap-6">
							{/* Company Info */}
							<div>
								<h1 className="text-3xl font-bold text-blue-900 mb-2">Swissbix SA</h1>
								<div className="space-y-2 text-sm text-gray-700">
									<div className="flex items-center">
										<Building2 className="w-4 h-4 mr-2 text-blue-600" />
										Via Baroffio 6, 6900 Lugano
									</div>
									<div className="flex items-center">
										<Mail className="w-4 h-4 mr-2 text-blue-600" />
										finance@swissbix.ch
									</div>
									<div className="flex items-center">
										<Phone className="w-4 h-4 mr-2 text-blue-600" />
										+41 91 960 22 00
									</div>
								</div>
							</div>

							{/* Banking Info */}
							<div>
								<h3 className="font-semibold text-gray-900 mb-2">Informazioni Bancarie</h3>
								<div className="space-y-1 text-sm text-gray-700">
									<div className="flex items-center">
										<CreditCard className="w-4 h-4 mr-2 text-blue-600" />
										UBS Switzerland AG
									</div>
									<p>
										<span className="font-medium">BIC:</span> UBSWCHZH80A
									</p>
									<p>
										<span className="font-medium">IBAN:</span> CH62 0024 7247 2096 9101 U
									</p>
									<p>
										<span className="font-medium">N. IVA UE:</span> CHE-136.887.933
									</p>
								</div>
							</div>
						</div>

						{/* Client Info */}
						<div className="mt-6 pt-4 border-t border-blue-200">
							<div className="bg-white rounded-lg p-4 border border-blue-100">
								<h3 className="font-semibold text-gray-900 mb-2">Cliente</h3>
								<div className="text-sm text-gray-700">
									<p className="font-medium">{response.cliente.nome}</p>
									<p>{response.cliente.indirizzo}, {response.cliente.citta}</p>
								</div>
							</div>
						</div>

						
					</CardContent>
				</Card>
				</>
			)}
		</GenericComponent>
  )
}
