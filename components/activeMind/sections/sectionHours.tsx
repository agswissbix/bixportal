"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import React from "react"

import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, AlertCircle, HelpCircle, Ticket, Phone, Key, Truck } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "@/components/genericComponent"

interface SectionHoursProps {
  data: {
    section2Products: {
      [key: string]: {
        quantity: number
      }
    }
    sectionHours: {
      selectedOption: string
      label: string
      price: number
      cost: number
      hours?: number
    }
  }
  dealid?: string
  onUpdate: (data: any) => void
}

const hoursColors: Record<string, string> = {
  0: "text-red-900",
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
    title: "Monitoraggio e assistenza da remoto",
    description: "I servizi scelti includono monitoraggio e assistenza da remoto con supporto tecnico illimitato tramite un ticket ad assistenza@swissbix.ch. Ogni richiesta prevede fino a 15 minuti di intervento; per problemi più complessi oltre questo tempo si potrà concordare un intervento in loco.",
  },
  {
    icon: Truck,
    title: "Assistenza On-Site",
    description: "Le ore effettive (arrivo-partenza) senza trasferta. Al termine compilazione rapporto firmato dal cliente.",
  },
  {
    icon: Key,
    title: "Attività di Progetto",
    description: "Le ore impiegate nelle attività di progetto verranno scalate dal monte ore sulla base delle ore effettive.",
  },
];

const isDev = false

interface ResponseInterface {
  options: Array<{
    id: string;
    label: string;
    description: string;
    icon: string;
    price: number; // Price per product
    cost: number;
    hours: number;
    selected?: boolean;
  }>;
}

const responseDataDEV: ResponseInterface = {
  options: [
    {
      id: "hours_10",
      label: "10 Ore",
      description: "Pacchetto da 10 ore",
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

export default function SectionHours({ data, onUpdate, dealid }: SectionHoursProps) {
  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT
  );

  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_monte_ore_activemind',
      dealid: dealid
    };
  }, [dealid]);

  const { response, loading, error } = useApiWrapper(payload);

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
  }, [response]);

  // Pricing is flat now, so no multiplication by products
  // const totalProducts = Object.values(data.section2Products || {}).reduce((acc, curr) => acc + curr.quantity, 0);

  const handleOptionSelect = (optionId: string, label: string, price: number, cost: number, hours: number) => {
    if (data.sectionHours?.selectedOption === optionId) {
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
      price: price, // Flat price
      cost: cost,
      hours: hours
    })
  }

  return (
    <GenericComponent loading={loading} error={error} >
      {(response: ResponseInterface) => (
        <div className="space-y-6">
          {/* Description - Green theme like section1 uses blue */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-900">
                <Clock className="w-8 h-8 md:w-6 md:h-6 lg:w-5 lg:h-5 mr-2" />
                Monte Ore Assistenza Tecnica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                Il servizio Monte Ore garantisce supporto tecnico flessibile e personalizzato per la tua azienda. 
                Le ore acquistate possono essere utilizzate per assistenza remota, interventi on-site e attività di progetto, 
                senza scadenza temporale.
              </p>
            </CardContent>
          </Card>

          {/* Features - Same structure as section1 */}
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
                      <Icon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
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

          {/* Hours Selection - Same style as tier selection in section1 */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Seleziona il pacchetto ore</CardTitle>
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
                  const isSelected = data.sectionHours?.selectedOption === option.id
                  const colorClass = hoursColors[index] || hoursColors.default

                  return (
                    <Card
                      key={option.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected ? `ring-2 ring-blue-500 bg-blue-50` : `hover:border-gray-300`
                      }`}
                      onClick={() => handleOptionSelect(option.id, option.label, option.price, option.cost, option.hours)}
                    >
                      <CardContent className="p-4 text-center">
                        <Icon className={`w-8 h-8 mx-auto mb-3 ${isSelected ? "text-blue-600" : colorClass}`} />
                        <h3 className="font-medium text-sm mb-2">{option.label}</h3>
                        <div className="text-2xl font-bold mb-2">
                          CHF {option.price.toLocaleString("it-CH")}.-
                        </div>
                        <p className="text-xs opacity-80 mb-2">{option.description}</p>
                        {isSelected && <Badge className="bg-blue-600 text-white hover:bg-blue-600">Selezionato</Badge>}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {data.sectionHours?.selectedOption && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">Pacchetto selezionato</h4>
                      <p className="text-sm text-green-700">{data.sectionHours.label}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-900">CHF {data.sectionHours.price.toLocaleString("it-CH")}.-</div>
                      <div className="text-sm text-green-700">Prezzo totale</div>
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
