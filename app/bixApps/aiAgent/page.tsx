import AiAgent from "@/components/bixApps/aiAgent/aiAgent";
import * as React from "react";

interface TimesheetBixAppProps {
  params: Promise<{}>;
}

export default async function AiAgentBixApp(props: TimesheetBixAppProps) {
  const params = await props.params;

  return (
    <AiAgent />
  );
}
