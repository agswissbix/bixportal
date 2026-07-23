import Timesheet from "@/components/bixApps/timesheet/timesheet";
import * as React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timesheet - BixData",
};

interface TimesheetDetailProps {
  params: Promise<{ recordid: string }>;

  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TimesheetDetail(props: TimesheetDetailProps) {
  const params = await props.params; 
  const idFromUrl = params.recordid;

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

  // 'reference' (fuori da 'data') indica quale campo di 'data' usare
  const reference = typeof searchParams.reference === 'string' ? searchParams.reference : null;
  const comingFrom = typeof searchParams.comingFrom === 'string' ? searchParams.comingFrom : null;

  return <Timesheet recordid={idFromUrl} data={data} reference={reference} comingFrom={comingFrom} />;
}