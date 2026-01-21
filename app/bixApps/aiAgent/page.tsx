import AiAgent from "@/components/bixApps/aiAgent/aiAgent";
import * as React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/api/manifest?app=aiAgent",
  title: "BixData AI Agent",
};

interface AiAgentBixAppProps {
  params: Promise<{}>;
}

export default async function AiAgentBixApp(props: AiAgentBixAppProps) {
  const params = await props.params;

  return (
    <AiAgent />
  );
}
