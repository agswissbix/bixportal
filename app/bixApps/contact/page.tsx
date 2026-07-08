import { Metadata } from "next";
import ContactApp from "@/components/bixApps/contact/contact";

export const metadata: Metadata = {
  manifest: "/api/manifest?app=contact",
  title: "Contact - BixData",
};

interface ContactBixAppProps {
  params: Promise<{}>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ContactBixApp(props: ContactBixAppProps) {
    const searchParams = await props.searchParams;

    const phoneNumber = typeof searchParams.phoneNumber === 'string' ? searchParams.phoneNumber : null;

    return (
        <ContactApp phoneNumber={phoneNumber} />
    );
}