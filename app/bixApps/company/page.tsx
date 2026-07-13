import CompanyApp from "@/components/bixApps/company/company";
import * as React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/api/manifest?app=company",
  title: "Company - BixData",
};

interface CompanyBixAppProps {
  params: Promise<{}>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CompanyBixApp(props: CompanyBixAppProps) {
  const searchParams = await props.searchParams;

  // Tutti i parametri sono serializzati in un unico JSON nel query param 'data'.
  let data: { [key: string]: any } = {};
  if (typeof searchParams.data === 'string') {
    try {
      data = JSON.parse(searchParams.data);
    } catch {
      data = {};
    }
  }

  // 'reference' (fuori da 'data') indica quale campo di 'data' usare per la ricerca.
  const reference = typeof searchParams.reference === 'string' ? searchParams.reference : null;

  // Passiamo l'intero JSON 'data' + il reference: aggiungere nuovi campi in futuro
  // non richiede modifiche né alla pagina né all'interfaccia del componente.
  return (
    <CompanyApp data={data} reference={reference} />
  );
}
