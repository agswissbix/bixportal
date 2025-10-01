"use client"

import { useEffect, useState, useMemo, use } from "react";
import {useApi} from "@/utils/useApi";
import GenericComponent from "@/components/genericComponent";

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

  const [responseData, setResponseData] = useState<ResponseInterface>(responseDefault);

  const payload = useMemo(() => {
		if (isDev) return null;
		return { 
			apiRoute: 'belotti_conferma_ricezione',
			recordid: recordId
		};
	}, [recordId]);
  
	const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };
	
	useEffect(() => {
			if (!isDev && response) { 
				console.log("Response received:", response);
				setResponseData(response); 
			}
	}, [response]);

  
  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
				<div>
					<h1>Conferma Ricezione</h1>
					<p>{response.message}</p>
					<p>{JSON.stringify(response.record, null, 2)}</p>
				</div>
			)}
		</GenericComponent>
  );
}
