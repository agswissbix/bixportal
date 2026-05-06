import { Navigation } from "@/components/admin/adminNavigation"
import { AdminProtection } from "@/components/admin/adminProtection"
import { PermissionsMatrix } from "@/components/admin/permissionsMatrix"

export default function AdminPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Amministrazione</h1>
      <p className="text-gray-600 dark:text-gray-300">Pannello di amministrazione del sistema.</p>
      
      <div className="mt-8">
        <PermissionsMatrix />
      </div>
    </>
  )
}
