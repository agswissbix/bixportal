import TaskApp from "@/components/bixApps/task/task";
import * as React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/api/manifest?app=task",
  title: "Task - BixData",
};

interface TaskBixAppProps {
  params: Promise<{}>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TaskBixApp(props: TaskBixAppProps) {
  const searchParams = await props.searchParams;

  // Tutti i parametri della mail sono serializzati in un unico JSON nel query param 'data'.
  let data: { [key: string]: any } = {};
  if (typeof searchParams.data === 'string') {
    try {
      data = JSON.parse(searchParams.data);
    } catch {
      data = {};
    }
  }

  // 'reference' e 'comingFrom' stanno FUORI da 'data'.
  const reference = typeof searchParams.reference === 'string' ? searchParams.reference : null;
  const comingFrom = typeof searchParams.comingFrom === 'string' ? searchParams.comingFrom : null;

  // Passiamo l'intero JSON 'data' + reference + comingFrom: il componente estrae i campi
  // e costruisce il deeplink alla mail.
  return (
    <TaskApp data={data} reference={reference} comingFrom={comingFrom} />
  );
}
