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

  const oggetto = typeof searchParams.oggetto === 'string' ? searchParams.oggetto : null;
  const mailmittente = typeof searchParams.mailmittente === 'string' ? searchParams.mailmittente : null;
  const usermittente = typeof searchParams.usermittente === 'string' ? searchParams.usermittente : null;
  const dataricezione = typeof searchParams.dataricezione === 'string' ? searchParams.dataricezione : null;
  const idmail = typeof searchParams.idmail === 'string' ? searchParams.idmail : null;

  return (
    <TaskApp 
        oggetto={oggetto} 
        mailmittente={mailmittente} 
        usermittente={usermittente} 
        dataricezione={dataricezione} 
        idmail={idmail} 
    />
  );
}
