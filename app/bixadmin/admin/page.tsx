import { Navigation } from "@/components/admin/adminNavigation"
import { AdminProtection } from "@/components/admin/adminProtection"
import { PermissionsMatrix } from "@/components/admin/permissionsMatrix"
import { OrdersMatrix } from "@/components/admin/ordersMatrix"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Amministrazione</h1>
      <p className="text-gray-600 dark:text-gray-300">Pannello di amministrazione del sistema.</p>
      
      <div className="mt-8">
        <Tabs defaultValue="permissions" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="permissions">Matrice Permessi</TabsTrigger>
            <TabsTrigger value="orders">Ordini Tabelle & Campi</TabsTrigger>
          </TabsList>
          
          <TabsContent value="permissions" className="m-0 border-none p-0 outline-none">
            <PermissionsMatrix />
          </TabsContent>
          
          <TabsContent value="orders" className="m-0 border-none p-0 outline-none">
            <OrdersMatrix />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
