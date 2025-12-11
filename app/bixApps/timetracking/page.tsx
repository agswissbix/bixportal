import Timetracking from "@/components/bixApps/timetracking/timetracking";
import * as React from "react";

interface TimesheetBixAppProps {
  params: {
    
  };
}

export default function TimesheetBixApp(props: TimesheetBixAppProps) {
  const { params } = props;
  const {  } = params;

  return (
    <Timetracking />
  );
}
