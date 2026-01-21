import Timesheet from "@/components/bixApps/timesheet/timesheet"
import * as React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/api/manifest?app=timesheet",
  title: "BixData Timesheet",
};

interface TimesheetBixAppProps {
  params: Promise<{}>;
}

export default async function TimesheetBixApp(props: TimesheetBixAppProps) {
  const params = await props.params;

  return (
    <Timesheet />
  );
}
