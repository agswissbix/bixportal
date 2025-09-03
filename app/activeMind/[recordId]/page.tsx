// app/activeMind/[recordId]/page.jsx
import * as React from "react";

import ActiveMind from "@/components/activeMind/activeMind";


interface ActiveMindPageProps {
  params: {
    recordId: string;
  };
}

export default function ActiveMindPage({ params }: ActiveMindPageProps) {
  const { recordId } = params;

  return (
    <ActiveMind recordIdTrattativa={recordId} />
  );
}
