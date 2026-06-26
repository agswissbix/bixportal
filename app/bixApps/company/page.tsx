import CompanyApp from "@/components/bixApps/company/company";
import * as React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/api/manifest?app=company",
  title: "Company - BixData",
};

interface CompanyBixAppProps {
  params: Promise<{}>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CompanyBixApp(props: CompanyBixAppProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const email = typeof searchParams.email === 'string' ? searchParams.email : null;
  const telefono = typeof searchParams.telefono === 'string' ? searchParams.telefono : null;
  const recordid = typeof searchParams.recordid === 'string' ? searchParams.recordid : null;

  return (
    <CompanyApp recordid={recordid} email={email} telefono={telefono} />
  );
}
