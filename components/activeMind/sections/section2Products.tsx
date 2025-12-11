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
  Calendar,
  CalendarDays
} from "lucide-react"
import GenericComponent from "@/components/genericComponent"


const isDev = false

interface ProductSelectionProps {
  data: {
    [key: string]: {
      title: string
      quantity: number
      unitPrice: number
      unitCost?: number
      total: number
      features?: string[]
      category?: "data_security" | "mobile_security" | "infrastructure" | "sophos" | "microsoft" | "firewall"
      monthlyPrice?: number
      yearlyPrice?: number
      description?: string
      billingType?: "monthly" | "yearly"
    }
  }
  dealid?: string
  onUpdate: (data: any) => void
}

interface Service {
  id: string
  title: string
  unitPrice: number
  unitCost?: number
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

const categoryLabels: { [key: string]: string } = {
  data_security: "Sicurezza Dati Informatici",
  mobile_security: "Sicurezza Dati Mobili",
  infrastructure: "Sicurezza Infrastruttura",
  sophos: "Servizi Sophos",
  microsoft: "Licenze Microsoft",
  firewall: "Firewall",
}

export default function ProductSelection({ data, onUpdate, dealid }: ProductSelectionProps) {
    const [responseData, setResponseData] = useState<ResponseInterface>(
        isDev ? responseDataDEV : responseDataDEFAULT
    );

    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_products_activemind',
            trattativaid: dealid
        };
    }, [dealid]);

    const { response, loading, error } = !isDev && payload
        ? useApi<ResponseInterface>(payload)
        : { response: null, loading: false, error: null };


  const [expandedServices, setExpandedServices] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string | undefined>()

    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
            setActiveCategory(response.servicesCategory[0].id)

            const initialData: Record<string, any> = {};

            response.servicesCategory.forEach((category) => {
              category.services.forEach((service) => {
                if (service as any && (service as any).quantity && (service as any).quantity > 0) {
                  const billingType = (service as any).billingType || "monthly";
                  const pricePerUnit =
                    billingType === "yearly" && service.yearlyPrice
                      ? service.yearlyPrice
                      : service.monthlyPrice || service.unitPrice;

                  initialData[service.id] = {
                    title: service.title,
                    quantity: (service as any).quantity,
                    unitPrice: pricePerUnit,
                    unitCost: service.unitCost ?? 0,
                    total: (service as any).quantity * pricePerUnit,
                    features: service.features || [],
                    category: service.category,
                    monthlyPrice: service.monthlyPrice,
                    yearlyPrice: service.yearlyPrice,
                    description: service.description,
                    billingType,
                  };
                }
              });
            });

            if (Object.keys(initialData).length > 0) {
              onUpdate(initialData);
            }
        }
    }, [response]);

  const toggleService = (serviceId: string) => {
    setExpandedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  const updateQuantity = (service: Service, quantity: number, billingType: "monthly" | "yearly" = "monthly") => {
    const pricePerUnit =
      billingType === "yearly" && service.yearlyPrice ? service.yearlyPrice : service.monthlyPrice || service.unitPrice

    const total = quantity * pricePerUnit

    onUpdate({
      [service.id]: {
        title: service.title,
        quantity,
        unitPrice: pricePerUnit,
        total,
        features: service.features || [],
        category: service.category,
        monthlyPrice: service.monthlyPrice,
        yearlyPrice: service.yearlyPrice,
        description: service.description,
        billingType,
      },
    })
  }

  const incrementQuantity = (service: Service) => {
    const currentQuantity = data[service.id]?.quantity || 0
    const currentBillingType = data[service.id]?.billingType || "monthly"
    updateQuantity(service, currentQuantity + 1, currentBillingType)
  }

  const decrementQuantity = (service: Service) => {
    const currentQuantity = data[service.id]?.quantity || 0
    const currentBillingType = data[service.id]?.billingType || "monthly"
    if (currentQuantity > 0) {
      updateQuantity(service, currentQuantity - 1, currentBillingType)
    }
  }

  const updateBillingType = (service: Service, billingType: "monthly" | "yearly") => {
    const currentQuantity = data[service.id]?.quantity || 0
    updateQuantity(service, currentQuantity, billingType)
  }

  const getTotalForAllServices = () => {
    return Object.values(data).reduce((sum, service) => sum + service.total, 0)
  }

  const getTotalForAllServicesByBillingType = (billingType: "monthly" | "yearly") => {
    return Object.values(data)
      .filter((service) => service.billingType === billingType)
      .reduce((sum, service) => sum + service.total, 0)
  }

  const getTotalForCategory = (categoryId: string) => {
    return Object.values(data)
      .filter((service: any) => service.category === categoryId)
      .reduce((sum, service) => sum + service.total, 0)
  }

  const renderService = (service: Service, index: number) => {
    const Icon = iconMap[service.icon] || Server
    const isExpanded = expandedServices.includes(service.id)
    const serviceData = data[service.id] || {
      quantity: 0,
      unitPrice: service.monthlyPrice || service.unitPrice,
      total: 0,
      billingType: "monthly" as const,
    }

    const hasBillingOptions = service.monthlyPrice && service.yearlyPrice

    const isMonthlySelected = serviceData.billingType === "monthly"
    const isYearlySelected = serviceData.billingType === "yearly"

    const renderBillingOption = (type: "monthly" | "yearly", price: number, label: string, IconComponent: React.ComponentType<{ className?: string }>, isSelected: boolean) => (
      <div
        key={type}
        className={`
          flex flex-col items-center justify-center p-2 rounded-lg border
          cursor-pointer transition-all duration-150 text-center flex-1 min-w-[100px]
          ${isSelected 
            ? "ring-2 ring-blue-500 bg-blue-100 border-blue-400" 
            : "hover:border-gray-400 bg-white border-gray-300"
          }
        `}
        onClick={(e) => {
          e.stopPropagation()
          updateBillingType(service, type)
        }}
      >
        <IconComponent className={`w-4 h-4 mb-1 ${isSelected ? "text-blue-600" : "text-gray-500"}`} />
        <div className="text-xs font-medium text-gray-700">{label}</div>
        <div className={`text-sm font-bold ${isSelected ? "text-blue-700" : "text-gray-800"}`}>
          CHF {price}.-
        </div>
      </div>
    )

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
          <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:items-start lg:space-x-3 justify-between">
            <div className="flex items-start space-x-3">
              <Icon className="w-6 h-6 text-gray-700 mt-1" />
              <div className="flex-1">
                <CardTitle className="text-lg">{service.title}</CardTitle>
                {service.description && <p className="text-xs text-gray-500 mt-1">{service.description}</p>}
                <div className="flex items-start mt-2">
                  {service.unitPrice && (
                    <Badge variant="secondary" className="text-xs">
                      CHF {service.unitPrice}/unità
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-end gap-4">
              {hasBillingOptions && (
                <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <label className="text-xs font-medium text-gray-600 mb-0.5">Fatturazione:</label>
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateBillingType(service, "monthly")
                      }}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                        transition-all duration-150 border whitespace-nowrap
                        ${isMonthlySelected 
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                        }
                      `}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Mensile</span>
                      <span className="font-semibold">CHF {service.monthlyPrice.toFixed(0)}.-</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateBillingType(service, "yearly")
                      }}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                        transition-all duration-150 border whitespace-nowrap
                        ${isYearlySelected 
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                        }
                      `}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Annuale</span><br />
                      <span className="text-md font-semibold">CHF {service.yearlyPrice.toFixed(0)}.-</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between lg:justify-end gap-4 flex-shrink-0">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Quantità:</label>
                  <div className="flex items-center gap-3">
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
                        className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-l-md border-r border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={serviceData.quantity <= 0}
                      >
                        <span className="text-lg font-bold">−</span>
                      </button>
                      <Input
                        type="number"
                        min="0"
                        value={serviceData.quantity}
                        onChange={(e) => {
                          const currentBillingType = serviceData.billingType || "monthly"
                          updateQuantity(service, Number.parseInt(e.target.value) || 0, currentBillingType)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-12 lg:w-16 text-center border-0 focus:ring-0 focus:border-0 rounded-none h-8 lg:h-10 no-spinner p-0"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          incrementQuantity(service)
                        }}
                        className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-r-md border-l border-gray-300"
                      >
                        <span className="text-lg font-bold">+</span>
                      </button>
                    </div>
                    
                    <div className={`text-right min-w-[100px] transition-opacity duration-150 ${serviceData.quantity > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      <div className="text-base font-bold text-blue-700 whitespace-nowrap">CHF {serviceData.total.toFixed(0)}.-</div>
                      <div className="text-xs text-gray-600 whitespace-nowrap">
                        {serviceData.billingType === "yearly" ? "Tot. annuale" : "Tot. mensile"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center self-start pt-6">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
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

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto p-1 bg-gray-100">
          {response.servicesCategory.map((category) => {
            const selectedCount = Object.values(data).filter(
              (service: any) => service.category === category.id && service.quantity > 0
            ).length;
            const hasSelected = selectedCount > 0;

                  return (
              <TabsTrigger
              key={category.id}
              value={category.id}
              className="hover:bg-gray-200 text-xs lg:text-sm p-2 lg:p-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
              <div className="text-center">
                <div className="font-medium flex items-center justify-center gap-1.5">
                  {categoryLabels[category.id]}
                  {hasSelected && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-500 rounded-full">
                      {selectedCount}
                    </span>
                  )}
                </div>
                <div className="text-xs opacity-80 hidden lg:block">{category.services.length} servizi</div>
              </div>
            </TabsTrigger>
          )
          })}
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
                      <div className="text-xl font-bold text-blue-900">CHF {getTotalForCategory(category.id).toFixed(0)}.-</div>
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
      {(getTotalForAllServicesByBillingType("monthly") > 0 || getTotalForAllServicesByBillingType("yearly") > 0) && (
        <Card className="bg-green-50 border-green-200 lg:sticky bottom-4 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
              <div>
                <h3 className="text-lg font-semibold text-green-900">Costo Totale Servizi Selezionati</h3>
                <p className="text-sm text-green-700">
                  {Object.values(data).filter((s: any) => s.quantity > 0).length} servizi selezionati
                </p>
              </div>
              <div className="text-right space-y-1">
                {getTotalForAllServicesByBillingType("monthly") > 0 && (
                  <div>
                    <div className="text-2xl font-bold text-green-900">
                      CHF {getTotalForAllServicesByBillingType("monthly").toFixed(0)}.-
                    </div>
                    <div className="text-sm text-green-700">Totale mensile</div>
                  </div>
                )}
                {getTotalForAllServicesByBillingType("yearly") > 0 && (
                  <div>
                    <div className="text-2xl font-bold text-green-900">
                      CHF {getTotalForAllServicesByBillingType("yearly").toFixed(0)}.-
                    </div>
                    <div className="text-sm text-green-700">Totale annuale</div>
                  </div>
                )}
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
