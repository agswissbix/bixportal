import Timesheet from "@/components/bixApps/timesheet/timesheet";
import * as React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timesheet - BixData",
};

interface TimesheetDetailProps {
  params: Promise<{ recordid: string }>;
}

export default async function TimesheetDetail(props: TimesheetDetailProps) {
  const params = await props.params;
  
  const idFromUrl = params.recordid;

  return <Timesheet recordid={idFromUrl} />;
}