"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import React from "react"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, AlertCircle, HelpCircle, Ticket, Phone, Truck } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "@/components/genericComponent"
import { formatPrice } from "@/utils/formatPrice"

interface SectionAssistanceBwbixProps {
  data: {
    sectionAssistanceBwbix?: {
      selectedOption: string
      label: string
      price: number
      cost: number
      hours?: number
    }
  }
  dealid?: string
  onUpdate: (data: any) => void
  isBwbix?: boolean
}

const hoursColors: Record<string, string> = {
  0: "text-teal-900",
  1: "text-blue-900",
  2: "text-green-900",
  3: "text-orange-900",
  4: "text-purple-900",
  5: "text-yellow-900",
  default: "bg-gray-50 border-gray-200 text-gray-900"
};

const assistanceConditions = [
  {
    icon: Ticket,
    title: "Richiesta Assistenza",
    description: "Apertura ticket con mail a helpdesk@swissbix.ch. Non verrà presa in considerazione nessuna richiesta effettuata in diversa modalità.",
  },
  {
    icon: Phone,
    title: "Supporto BwBix",
    description: "Supporto tecnico professionale dedicato alle soluzioni BwBix.",
  },
];

const isDev = false

interface ResponseInterface {
  options: Array<{
    id: string;
    label: string;
    description: string;
    icon: string;
    price: number; 
    cost: number;
    hours: number;
    selected?: boolean;
  }>;
}

const responseDataDEV: ResponseInterface = {
  options: [
    {
      id: "assistance_1",
      label: "Giorni lavorativi",
      description: "lun - ven 8:00 - 17:00",
      icon: "Clock",
      price: 10,
      cost: 10,
      hours: 10
    }
  ]
}

const responseDataDEFAULT: ResponseInterface = {
  options: []
};

const useApiWrapper = (payload: any) => {
  const { response, loading, error } = useApi<ResponseInterface>(payload);
  return { response, loading, error };
};

export default function SectionAssistanceBwbix({ data, onUpdate, dealid, isBwbix }: SectionAssistanceBwbixProps) {
  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT
  );

  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_assistance_bwbix_activemind',
      dealid: dealid,
    };
  }, [dealid]);

  const { response, loading, error } = useApiWrapper(payload);

  const [editingPrice, setEditingPrice] = useState<string | null>(null)

  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);

      const selectedOpt = response.options.find((opt) => opt.selected);
      if (selectedOpt) {
        onUpdate({
          selectedOption: selectedOpt.id,
          label: selectedOpt.label,
          price: selectedOpt.price,
          cost: selectedOpt.cost,
          hours: selectedOpt.hours,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handleOptionSelect = (optionId: string, label: string, price: number, cost: number, hours: number) => {
    if (data.sectionAssistanceBwbix?.selectedOption === optionId) {
      onUpdate({
        selectedOption: null,
        label: null,
        price: 0,
        cost: 0,
        hours: 0
      })
      return
    }
    onUpdate({
      selectedOption: optionId,
      label: label,
      price: price,
      cost: cost,
      hours: hours
    })
  }

  const handlePriceEdit = (optionId: string, newValue: string) => {
    const numValue = parseFloat(newValue)
    if (!isNaN(numValue) && numValue >= 0) {
      const option = responseData.options.find((o) => o.id === optionId)
      if (option) {
        option.price = numValue
        // If it's the currently selected option, update the parent
        if (data.sectionAssistanceBwbix?.selectedOption === optionId) {
          onUpdate({
            selectedOption: option.id,
            label: option.label,
            price: option.price,
            cost: option.cost,
            hours: option.hours
          })
        }
      }
    }
  }

  return (
    <GenericComponent loading={loading} error={error} >
      {(response: ResponseInterface) => (
        <div className="space-y-6">
          <Card className="bg-teal-50 border-teal-200">
            <CardHeader>
              <CardTitle className="flex items-center text-teal-900">
                <Clock className="w-8 h-8 md:w-6 md:h-6 lg:w-5 lg:h-5 mr-2" />
                Opzioni di Assistenza
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                Il servizio fornisce l'accesso all'assistenza nei giorni e negli orari selezionati, garantendo continuità e sicurezza.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ticket className="w-12 h-12 md:w-6 md:h-6 lg:w-5 lg:h-5 mr-2" />
                Modalità di gestione assistenza
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {assistanceConditions.map((condition, index) => {
                  const Icon = condition.icon
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <Icon className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-sm text-gray-700 font-medium">{condition.title}</span>
                        <p className="text-sm text-gray-600">{condition.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Seleziona il pacchetto di giorni/orari</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {responseData.options.map((option, index) => {
                  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                    Clock,
                    CheckCircle2,
                    AlertCircle,
                    HelpCircle
                  };
                  const Icon = iconMap[option.icon] || Clock;
                  const isSelected = data.sectionAssistanceBwbix?.selectedOption === option.id
                  const colorClass = hoursColors[index] || hoursColors.default

                  return (
                    <Card
                      key={option.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected ? `ring-2 ring-teal-500 bg-teal-50` : `hover:border-gray-300`
                      }`}
                      onClick={() => handleOptionSelect(option.id, option.label, option.price, option.cost, option.hours)}
                    >
                      <CardContent className="p-4 text-center">
                        <Icon className={`w-8 h-8 mx-auto mb-3 ${isSelected ? "text-teal-600" : colorClass}`} />
                        <h3 className="font-medium text-sm mb-2">{option.label}</h3>
                        <div className="text-2xl font-bold mb-2">
                          CHF {" "}
                          {editingPrice === option.id ? (
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              className="w-20 h-8 p-0 bg-transparent border-b border-gray-400 rounded-none text-2xl inline text-center ml-1"
                              autoFocus
                              defaultValue={option.price}
                              onBlur={(e) => {
                                handlePriceEdit(option.id, e.target.value)
                                setEditingPrice(null)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handlePriceEdit(option.id, e.currentTarget.value)
                                  setEditingPrice(null)
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span 
                              onDoubleClick={(e) => { e.stopPropagation(); setEditingPrice(option.id) }}
                              className="cursor-pointer"
                            >
                               {formatPrice(option.price)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs opacity-80 mb-2">{option.description}</p>
                        {isSelected && <Badge className="bg-teal-600 text-white hover:bg-teal-600">Selezionato</Badge>}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {data.sectionAssistanceBwbix?.selectedOption && (
                <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-teal-900">Pacchetto selezionato</h4>
                      <p className="text-sm text-teal-700">{data.sectionAssistanceBwbix.label}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-teal-900">CHF {formatPrice(data.sectionAssistanceBwbix.price)}</div>
                      <div className="text-sm text-teal-700">Prezzo totale</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </GenericComponent>
  )
}
