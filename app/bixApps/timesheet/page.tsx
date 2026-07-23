import Timesheet from "@/components/bixApps/timesheet/timesheet"
import { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/api/manifest?app=timesheet",
  title: " Timesheet - BixData",
};

interface TimesheetBixAppProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TimesheetBixApp(props: TimesheetBixAppProps) {
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

  // 'reference' (fuori da 'data') indica quale campo di 'data' usare.
  const reference = typeof searchParams.reference === 'string' ? searchParams.reference : null;
  const comingFrom = typeof searchParams.comingFrom === 'string' ? searchParams.comingFrom : null;

  return (
    <Timesheet data={data} reference={reference} comingFrom={comingFrom} />
  );
}
