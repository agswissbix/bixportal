import * as React from "react";
import ActiveMind from "@/components/activeMind/activeMind";

interface ActiveMindPageProps {
  params: Promise<{
    recordId: string;
  }>;
}

export default async function ActiveMindPage(props: ActiveMindPageProps) {
  const params = await props.params;
  // If you need to await something, do it here. For now, just destructure.
  const { recordId } = params;

  return (
    <ActiveMind recordIdTrattativa={recordId} />
  );
}
