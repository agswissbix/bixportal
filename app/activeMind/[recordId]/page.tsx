import * as React from "react";
import ActiveMind from "@/components/activeMind/activeMind";

interface ActiveMindPageProps {
  params: {
    recordId: string;
  };
}

export default function ActiveMindPage(props: ActiveMindPageProps) {
  const { params } = props;
  // If you need to await something, do it here. For now, just destructure.
  const { recordId } = params;

  return (
    <ActiveMind recordIdTrattativa={recordId} />
  );
}
