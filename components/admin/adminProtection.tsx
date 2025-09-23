"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useContext } from "react"
import { AppContext } from "@/context/appContext";
import LoadingComp from "../loading"

interface AdminProtectionProps {
  children: React.ReactNode
}

export function AdminProtection({ children }: AdminProtectionProps) {
	const router = useRouter()
	const { role } = useContext(AppContext);
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		setLoading(true)
    if (role !== 'Admin') {
    //   router.push('/home');
    }
		setLoading(false)
  }, [role]);

	if (loading) {
		return (
			<LoadingComp />
		)
	}

  return <>{children}</>
}
