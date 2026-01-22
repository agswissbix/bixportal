import * as React from "react";
import { Metadata } from "next";
import BixMobileHub from "@/components/bixApps/bixMobileHub/bixMobileHub";

export const metadata: Metadata = {
  manifest: "/api/manifest?app=bixMobileHub",
  title: "BixData Mobile Hub",
};

interface BixMobileHubBixAppProps {
  params: Promise<{}>;
}

export default async function BixMobileHubBixApp(props: BixMobileHubBixAppProps) {
  const params = await props.params;

  return (
    <BixMobileHub />
  );
}
