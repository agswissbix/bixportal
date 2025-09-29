"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApi } from "@/utils/useApi"
import {
  ChevronDown,
  ChevronUp,
  Server,
  Monitor,
  Shield,
  Wifi,
  HardDrive,
  Database,
  Cloud,
  Smartphone,
  Search,
  Mail,
  AlertTriangle,
} from "lucide-react"
import GenericComponent from "@/components/genericComponent"


const isDev = false

interface ProductSelectionProps {
  data: {
    [key: string]: {
      title: string
      quantity: number
      unitPrice: number
      total: number
      features?: string[]
    }
  }
  onUpdate: (data: any) => void
}

interface Service {
  id: string
  title: string
  unitPrice: number
  icon: string
  features: string[]
  category: "data_security" | "mobile_security" | "infrastructure" | "sophos" | "microsoft" | "firewall"
  monthlyPrice?: number
  yearlyPrice?: number
  description?: string
}
 

interface ServiceCategory {
  id: string
  title: string
  description: string
  services: Service[]
}

interface ResponseInterface {
    servicesCategory: ServiceCategory[]
}

const responseDataDEV: ResponseInterface = {
    servicesCategory: [
        {
            id: "data_security",
            title: "Sicurezza Dati",
            description: "Servizi per la protezione e gestione dei dati",
            services: [
                {
                    "id": "be_all_rmm",
                    "title": "Be All RMM (automatico da agent)",
                    "unitPrice": 10,
                    "monthlyPrice": 10,
                    "yearlyPrice": 96,
                    "icon": "Monitor",
                    "category": "data_security",
                    "description": "Presidio da remoto automatico con gestione patch e inventario",
                    "features": [
                        "Presidio da remoto (automatico)",
                        "Gestione delle patch windows",
                        "Attivazione script di controllo",
                        "Inventario HW/SW e report",
                    ],
                },

            ]
        }
    ]
};

const responseDataDEFAULT: ResponseInterface = {
    servicesCategory: [],
    
};

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Server,
  Monitor,
  Shield,
  Wifi,
  HardDrive,
  Database,
  Cloud,
  Smartphone,
  Search,
  Mail,
  AlertTriangle,
}

export default function ProductSelection({ data, onUpdate }: ProductSelectionProps) {
    const [responseData, setResponseData] = useState<ResponseInterface>(
        isDev ? responseDataDEV : responseDataDEFAULT
    );

    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_products_activemind',
        };
    }, []);

    const { response, loading, error } = !isDev && payload
        ? useApi<ResponseInterface>(payload)
        : { response: null, loading: false, error: null };


  const [expandedServices, setExpandedServices] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string | undefined>()

    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
            setActiveCategory(response.servicesCategory[0].id)
        }
    }, [response]);

  const toggleService = (serviceId: string) => {
    setExpandedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  const updateQuantity = (service: Service, quantity: number) => {
    const total = quantity * service.unitPrice

    onUpdate({
      [service.id]: {
        title: service.title,
        quantity,
        unitPrice: service.unitPrice,
        total,
        features: service.features || [],
        category: service.category,
      },
    })
  }

  const incrementQuantity = (service: Service) => {
    const currentQuantity = data[service.id]?.quantity || 0
    updateQuantity(service, currentQuantity + 1)
  }

  const decrementQuantity = (service: Service) => {
    const currentQuantity = data[service.id]?.quantity || 0
    if (currentQuantity > 0) {
      updateQuantity(service, currentQuantity - 1)
    }
  }

  const getTotalForAllServices = () => {
    return Object.values(data).reduce((sum, service) => sum + service.total, 0)
  }

  const getTotalForCategory = (categoryId: string) => {
    return Object.values(data)
      .filter((service: any) => service.category === categoryId)
      .reduce((sum, service) => sum + service.total, 0)
  }

  const renderService = (service: Service, index: number) => {
    const Icon = iconMap[service.icon] || Server
    const isExpanded = expandedServices.includes(service.id)
    const serviceData = data[service.id] || { quantity: 0, unitPrice: service.unitPrice, total: 0 }

    return (
      <Card
        key={service.id}
        className={`${
            index % 2 === 0
            ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
        } transition-all duration-200 cursor-pointer`}
        onClick={() => toggleService(service.id)}
        >
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <Icon className="w-6 h-6 text-gray-700" />
              <div>
                <CardTitle className="text-lg">{service.title}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-sm text-gray-600">CHF {service.unitPrice} per unità</p>
                  {service.monthlyPrice && (
                    <Badge variant="outline" className="text-xs">
                      {service.monthlyPrice}/mese
                    </Badge>
                  )}
                  {service.yearlyPrice && (
                    <Badge variant="outline" className="text-xs">
                      {service.yearlyPrice}/anno
                    </Badge>
                  )}
                </div>
                {service.description && <p className="text-xs text-gray-500 mt-1">{service.description}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between lg:justify-end space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Quantità:</label>
                <div
                  className="flex items-center border border-gray-300 rounded-md bg-white"
                  onClick={(e) => e.stopPropagation()}
                  >
                  <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        decrementQuantity(service)
                    }}
                    className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-l-md border-r border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={serviceData.quantity <= 0}
                    >
                    <span className="text-lg font-bold">−</span>
                  </button>
                  <Input
                    type="number"
                    min="0"
                    value={serviceData.quantity}
                    onChange={(e) => updateQuantity(service, Number.parseInt(e.target.value) || 0)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-16 text-center border-0 focus:ring-0 focus:border-0 rounded-none h-10 no-spinner"
                    />
                  <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        incrementQuantity(service)
                    }}
                    className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-r-md border-l border-gray-300"
                    >
                    <span className="text-lg font-bold">+</span>
                  </button>
                </div>
              </div>

              {serviceData.quantity > 0 && (
                  <div className="text-right">
                  <div className="text-lg font-bold text-blue-700">CHF {serviceData.total}</div>
                  <div className="text-xs text-gray-600">Totale</div>
                </div>
              )}

              <div className="flex items-center">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
            <CardContent className="pt-0">
            <div className="bg-white/70 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Caratteristiche incluse:</h4>
              <div className="grid gap-2 lg:grid-cols-2">
                {service.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
    {(response: ResponseInterface) => (
    <>
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Selezione Prodotti e Servizi</h2>
        <p className="text-gray-600">
          Scegli i prodotti e servizi più adatti alle tue esigenze dal nostro catalogo completo
        </p>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto p-1">
          {response.servicesCategory.map((category) => (
              <TabsTrigger
              key={category.id}
              value={category.id}
              className="text-xs lg:text-sm p-2 lg:p-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
              <div className="text-center">
                <div className="font-medium">{category.title.split(" ")[0]}</div>
                <div className="text-xs opacity-80 hidden lg:block">{category.services.length} servizi</div>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {response.servicesCategory.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">{category.title}</h3>
                    <p className="text-sm text-blue-700">{category.description}</p>
                  </div>
                  {getTotalForCategory(category.id) > 0 && (
                      <div className="text-right">
                      <div className="text-xl font-bold text-blue-900">CHF {getTotalForCategory(category.id)}.-</div>
                      <div className="text-sm text-blue-700">Totale categoria</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 grid-cols-1">
              {category.services.map((service, index) => renderService(service, index))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Total Summary */}
      {getTotalForAllServices() > 0 && (
          <Card className="bg-green-50 border-green-200 sticky bottom-4 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
              <div>
                <h3 className="text-lg font-semibold text-green-900">Costo Totale Servizi Selezionati</h3>
                <p className="text-sm text-green-700">
                  {Object.values(data).filter((s) => s.quantity > 0).length} servizi selezionati
                </p>
                <p className="text-xs text-green-600">
                  I prezzi possono variare in base alla frequenza di fatturazione scelta
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-900">CHF {getTotalForAllServices()}.-</div>
                <div className="text-sm text-green-700">Totale stimato</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </>
    )}    
  </GenericComponent>
  )
}
