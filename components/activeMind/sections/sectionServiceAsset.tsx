"use client"

import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // Removed unused
import { Card } from "@/components/ui/card" // Helper for loading state (used in error/loading only? Actually used in Loading state)
import { CardContent } from "@/components/ui/card" // Re-adding for Error/Loading states if needed, or just let them stay for now.
// Actually I used Card in Error state. Let's keep it but maybe clean up later.
// I will just update the line to keep what's needed.
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Server, Database, Shield, Globe, Box,  } from "lucide-react"
import axiosInstanceClient from "@/utils/axiosInstanceClient"

interface ServiceAssetItem {
  id: string
  label: string
  note: string
  provider: string
  quantity: number
  sector: string
  type: string
  status: string
  product_name: string
}

interface SectionServiceAssetProps {
  dealid: string
  data: { [key: string]: ServiceAssetItem }
  onUpdate: (data: { [key: string]: ServiceAssetItem }) => void
}

const sectorIcons: Record<string, any> = {
  Hosting: Server,
  Software: Box,
  Swisscom: Globe,
  ICT: Database,
  Printing: Shield,
}

const sectorColors: Record<string, string> = {
  Hosting: "bg-blue-50 text-blue-600",
  Software: "bg-purple-50 text-purple-600",
  Swisscom: "bg-indigo-50 text-indigo-600",
  ICT: "bg-cyan-50 text-cyan-600",
  Printing: "bg-amber-50 text-amber-600",
}

export default function SectionServiceAsset({ dealid, data, onUpdate }: SectionServiceAssetProps) {
  const [items, setItems] = useState<ServiceAssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchServiceAssets = async () => {
      try {
        setLoading(true)
        const response = await axiosInstanceClient.post("/postApi", {
          apiRoute: "get_service_and_asset_activemind",
          dealid: dealid,
        })

        if (response.data && response.data.options) {
          const fetchedItems = response.data.options
          setItems(fetchedItems)
          
          // Auto-populate data in parent since it's read-only and we want all items "available" for the summary/pdf
          // We convert the array to a dictionary keyed by ID for consistency with other sections
          const dataMap: { [key: string]: ServiceAssetItem } = {}
          fetchedItems.forEach((item: ServiceAssetItem) => {
            dataMap[item.id] = item
          })
          onUpdate(dataMap)
        }
      } catch (err) {
        console.error("Error fetching service and assets:", err)
        setError("Impossibile caricare i dati. Riprova più tardi.")
      } finally {
        setLoading(false)
      }
    }

    fetchServiceAssets()
  }, [dealid]) // Depend only on dealid to avoid infinite loops if onUpdate changes

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600 text-center">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
          <div>
              <h3 className="text-lg font-semibold text-gray-900">Asset e Servizi rilevati</h3>
              <p className="text-sm text-gray-500">
                Trovati <span className="font-medium text-gray-900">{items.length}</span> elementi attivi.
              </p>
          </div>
          {/* Future: Add filters here */}
      </div>

      <ScrollArea className="h-[600px] w-full pr-4 -mr-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
             <Server className="w-10 h-10 text-gray-300 mb-3" />
             <p className="text-gray-500 font-medium">Nessun elemento trovato.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
            {items.map((item) => {
              const Icon = sectorIcons[item.sector] || Box
              const color = sectorColors[item.sector] || "bg-gray-50 text-gray-600"
              
              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md rounded-xl p-5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                         <div className={`p-2.5 rounded-lg ${color}`}>
                           <Icon className="w-5 h-5" />
                         </div>
                         <div>
                            <h4 className="font-semibold text-gray-900 leading-tight line-clamp-1" title={item.label}>
                                {item.label}
                            </h4>
                            {item.product_name && item.product_name !== item.label && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1" title={item.product_name}>
                                    {item.product_name}
                                </p>
                            )}
                         </div>
                    </div>
                    <Badge variant="outline" className={
                        item.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 
                        'bg-gray-50 text-gray-600 border-gray-200'
                    }>
                        {item.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                     <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-50 rounded px-2 py-1.5">
                            <span className="text-xs text-gray-400 block uppercase tracking-wider mb-0.5">Tipo</span>
                            <span className="font-medium text-gray-700 line-clamp-1" title={item.type}>{item.type}</span>
                        </div>
                         <div className="bg-gray-50 rounded px-2 py-1.5">
                            <span className="text-xs text-gray-400 block uppercase tracking-wider mb-0.5">Settore</span>
                            <span className="font-medium text-gray-700 line-clamp-1" title={item.sector}>{item.sector}</span>
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                         <div className="flex items-center space-x-2">
                             <span className="text-xs text-gray-400 uppercase tracking-wider">Fornitore</span>
                             <span className="text-sm font-medium text-gray-700">{item.provider || 'N/A'}</span>
                         </div>
                         <div className="flex items-center">
                             <span className="text-xs text-gray-400 uppercase tracking-wider mr-2">Qta</span>
                             <Badge variant="secondary" className="font-mono">{item.quantity}</Badge>
                         </div>
                     </div>
                  </div>

                  {item.note && (
                    <div className="mt-4 text-xs text-gray-500 bg-yellow-50/50 border border-yellow-100 p-2 rounded text-left">
                       {item.note}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
