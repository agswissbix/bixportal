import Timesheet from "@/components/bixApps/timesheet/timesheet"
import * as React from "react";

interface TimesheetBixAppProps {
  params: Promise<{}>;
}

export default async function TimesheetBixApp(props: TimesheetBixAppProps) {
  const params = await props.params;

  return (
    <Timesheet />
  );
}
