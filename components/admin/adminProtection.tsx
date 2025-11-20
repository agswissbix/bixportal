"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useContext } from "react"
import { AppContext } from "@/context/appContext";
import LoadingComp from "../loading"

interface AdminProtectionProps {
  children: React.ReactNode
}

export function AdminProtection({ children }: AdminProtectionProps) {
	const router = useRouter()
	const pathname = usePathname();
	const { role, activeServer } = useContext(AppContext);
	const [loading, setLoading] = useState(true)

	const skipAdminForRoutes = ["/bixadmin/utenti"];
	const skipAdminForServers = ["wegolf"];

	const shouldSkipCheck =
		skipAdminForRoutes.includes(pathname) &&
		skipAdminForServers.includes(activeServer);

	useEffect(() => {
		setLoading(true)

		if (role !== 'admin' && !shouldSkipCheck) {
			router.push('/home');
		}

		setLoading(false)
  	}, [role, pathname, activeServer]);

	if (loading) {
		return (
			<LoadingComp />
		)
	}

  return <>{children}</>
}
