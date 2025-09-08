"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigationItems = [
  { name: "Utenti", href: "/bixadmin/utenti" },
  { name: "Tabelle", href: "/bixadmin/tabelle" },
  { name: "Grafici", href: "/bixadmin/grafici" },
  { name: "Scheduler", href: "/bixadmin/scheduler" },
  { name: "Monitoring", href: "/bixadmin/monitoring" },
  { name: "Admin", href: "/bixadmin/admin" },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors hover:text-white",
                  pathname === item.href
                    ? "text-white border-b-2 border-blue-500"
                    : "text-gray-300 hover:bg-gray-700 rounded-md",
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <button className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
