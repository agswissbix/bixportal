"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveServer } from "@/utils/auth";

export default function Home() {

  const [activeServer, setActiveServer] = useState<string>('');

  useEffect(() => {
    const fetchActiveServer = async () => {
      const server = await getActiveServer();
      setActiveServer(server.activeServer);
    };
    fetchActiveServer();
  }, []);

  const router = useRouter();
  useEffect(() => {
    if (activeServer === 'telefonoamico') {
      router.replace('/custom/ta');
    } else {
      router.replace('/home');
    }
  }, [activeServer, router]);
  return (
    null
  );
}
