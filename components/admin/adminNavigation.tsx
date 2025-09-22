"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { toast } from "sonner"

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
          <LogoutButton />
        </div>
      </div>
    </nav>
  )

  
}

const LogoutButton: React.FC = () => {
  const handleLogout = async () => {
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "logout",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      localStorage.removeItem("token");
      window.location.href = "/login"; // Redirect to login page
      toast.success("Logout effettuato con successo");
    } catch (error) {
      console.error("Errore durante il logout", error);
      toast.error("Errore durante il logout");
    }
  };

  return (
   <button
  onClick={handleLogout}
  className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 text-green-100 hover:bg-green-700 hover:text-white"
  title="Logout"
  data-oid="logout-button"
>
  {/* Nuova icona */}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-2"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    data-oid="logout-icon"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H9m5 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
      data-oid="new-logout-path"
    />
  </svg>
  <span className="hidden xl:inline" data-oid="logout-text">
    Logout
  </span>
</button>

  );
};