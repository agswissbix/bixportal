import CompanyApp from "@/components/bixApps/company/company";
import * as React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company - BixData",
};

interface CompanyDetailProps {
  params: Promise<{ recordid: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CompanyDetail(props: CompanyDetailProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const idFromUrl = params.recordid;
  const email = typeof searchParams.email === 'string' ? searchParams.email : null;
  const telefono = typeof searchParams.telefono === 'string' ? searchParams.telefono : null;

  return <CompanyApp recordid={idFromUrl} email={email} telefono={telefono} />;
}
