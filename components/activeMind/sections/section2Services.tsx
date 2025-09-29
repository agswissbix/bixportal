"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Server, Monitor, Shield, Wifi, HardDrive, Database, Cloud } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "@/components/genericComponent"

interface Section2Props {
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
  id: string;
  title: string;
  unitPrice: number;
  icon: string;
  features: string[];
}

interface ResponseInterface {
  services: Service[];
}

const isDev = false

const responseDataDEV: ResponseInterface = {
  services: [
    {
      id: "windowsServerVM",
      title: "Windows server (VM)",
      unitPrice: 250,
      icon: "Server",
      features: ["Aggiornamenti software", "Windows server"]
    }
  ]
};

const responseDataDEFAULT: ResponseInterface = {
  services: []
};

export default function Section2Services({ data, onUpdate }: Section2Props) {
  const [responseData, setResponseData] = useState<ResponseInterface>(
          isDev ? responseDataDEV : responseDataDEFAULT
      );
  
      const payload = useMemo(() => {
          if (isDev) return null;
          return {
              apiRoute: 'get_services_activemind',
          };
      }, []);
    
      const { response, loading, error } = !isDev && payload
          ? useApi<ResponseInterface>(payload)
          : { response: null, loading: false, error: null };
  
      useEffect(() => {
          if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
              setResponseData(response);
              
          }
      }, [response]);
  
  const [expandedServices, setExpandedServices] = useState<string[]>([])

  const toggleService = (serviceId: string) => {
    setExpandedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  const updateQuantity = (serviceId: string, quantity: number) => {
    const service = responseData.services.find((s) => s.id === serviceId)
    if (!service) return

    const total = quantity * service.unitPrice

    onUpdate({
      [serviceId]: {
        title: service.title,
        quantity,
        unitPrice: service.unitPrice,
        total,
        features: service.features || []
      },
    })
  }

  const incrementQuantity = (serviceId: string) => {
    const currentQuantity = data[serviceId]?.quantity || 0
    updateQuantity(serviceId, currentQuantity + 1)
  }

  const decrementQuantity = (serviceId: string) => {
    const currentQuantity = data[serviceId]?.quantity || 0
    if (currentQuantity > 0) {
      updateQuantity(serviceId, currentQuantity - 1)
    }
  }

  const getTotalForAllServices = () => {
    return Object.values(data).reduce((sum, service) => sum + service.total, 0)
  }

  return (
    <GenericComponent loading={loading} error={error} >
      {(response : ResponseInterface) => (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-1">
            {responseData.services.map((service) => {
              const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
                Server,
                Monitor,
                Shield,
                Wifi,
                HardDrive,
                Database,
                Cloud,
              };
              const Icon = iconMap[service.icon] || Server;
              const isExpanded = expandedServices.includes(service.id)
              const serviceData = data[service.id] || { quantity: 0, unitPrice: service.unitPrice, total: 0 }

              return (
                <Card
                  key={service.id}
                  className={`${(responseData.services.indexOf(service) % 2 === 0
                      ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    )
                  } transition-all duration-200 cursor-pointer`}
                  onClick={() => toggleService(service.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-6 h-6 text-gray-700" />
                        <div>
                          <CardTitle className="text-lg">{service.title}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">CHF {service.unitPrice} per unità</p>
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
                                decrementQuantity(service.id)
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
                            onChange={(e) =>
                              updateQuantity(service.id, Number.parseInt(e.target.value) || 0)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 text-center border-0 focus:ring-0 focus:border-0 rounded-none h-10 no-spinner"
                          />

                          <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                incrementQuantity(service.id)
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
                        <h4 className="font-medium text-gray-900 mb-3">Servizi inclusi:</h4>
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
            })}
          </div>

          {/* Total Summary */}
          {getTotalForAllServices() > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Costo Totale Servizi</h3>
                    <p className="text-sm text-green-700">per pianficazione Mensile</p>
                    <p className="text-sm text-green-700">
                      {Object.values(data).filter((s) => s.quantity > 0).length} servizi selezionati
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-900">CHF {getTotalForAllServices()}.-</div>
                    <div className="text-sm text-green-700">Totale</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </GenericComponent>
  )
}
