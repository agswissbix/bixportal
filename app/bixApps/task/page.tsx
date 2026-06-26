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

  const oggetto = typeof searchParams.subject === 'string' ? searchParams.subject : null;
  const mailmittente = typeof searchParams.sender === 'string' ? searchParams.sender : null;
  const usermittente = typeof searchParams.senderName === 'string' ? searchParams.senderName : null;
  const dataricezione = typeof searchParams.date === 'string' ? searchParams.date : null;
  const idmail = typeof searchParams.mailId === 'string' ? searchParams.mailId : null;

    const deepLink =
    "https://outlook.office.com/owa/?ItemID=" +
    encodeURIComponent(idmail) +                  // re-encode
    "&exvsurl=1&viewmodel=ReadMessageItem";	      // exvsurl=1 --> Makes sure that the link resolves to the correct mailbox
						                                      // viewmodel=ReadMessageItem --> Makes the link know this is a mail (not calendar or other stuff) and that it needs to open it

  return (
    <TaskApp 
        oggetto={oggetto} 
        mailmittente={mailmittente} 
        usermittente={usermittente} 
        dataricezione={dataricezione} 
        linkToMail={deepLink} 
    />
  );
}
