import Timetracking from "@/components/bixApps/timetracking/timetracking";
import * as React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/api/manifest?app=timetracking",
  title: "BixData Timetracking",
};

interface TimetrackingBixAppProps {
  params: Promise<{}>;
}

export default async function TimetrackingBixApp(props: TimetrackingBixAppProps) {
  const params = await props.params;

  return (
    <Timetracking />
  );
}
