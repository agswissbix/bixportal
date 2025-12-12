import Timetracking from "@/components/bixApps/timetracking/timetracking";
import * as React from "react";

interface TimetrackingBixAppProps {
  params: Promise<{}>;
}

export default async function TimetrackingBixApp(props: TimetrackingBixAppProps) {
  const params = await props.params;

  return (
    <Timetracking />
  );
}
