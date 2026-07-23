import Timetracking from "@/components/bixApps/timetracking/timetracking";
import * as React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/api/manifest?app=timetracking",
  title: "Timetracking - BixData",
};

interface TimetrackingBixAppProps {
  params: Promise<{}>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TimetrackingBixApp(props: TimetrackingBixAppProps) {
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
  const comingFrom = typeof searchParams.comingFrom === 'string' ? searchParams.comingFrom : null;

  return (
    <Timetracking data={data} reference={reference} comingFrom={comingFrom} />
  );
}
