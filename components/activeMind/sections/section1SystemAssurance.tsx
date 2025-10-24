"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Monitor, Server, Shield, FileText, LucideIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "@/components/genericComponent"

interface Section1Props {
  data: {
    selectedTier: string
    price: number
  }
  recordIdTrattativa?: string
  onUpdate: (data: any) => void
}

const features = [
  "Installazione agent RMM (1 mese)",
  "Avvio e riesamina dello stato dei PC",
  "Generazione di un Asset managed (inventario)",
  "Verifica infrastruttura informatica",
  "Device networking",
  "Nas/storage",
  "Switch/router",
  "Reportistica sull'infrastruttura informatica",
]

const isDev = false

interface ResponseInterface {
  tiers: {
    id: string
    label: string
    price: number
    icon?: LucideIcon
    selected?: boolean
  }[]
}

const responseDataDEFAULT: ResponseInterface = {
  tiers: []
}

const responseDataDEV: ResponseInterface = {
  tiers: [
    { id: "tier1", label: "Fino a 5 PC + server", price: 490, icon: Monitor },
    { id: "tier2", label: "Fino a 10 PC + server", price: 690, icon: Monitor },
    { id: "tier3", label: "Fino a 15 PC + server", price: 890, icon: Monitor },
    { id: "tier4", label: "Fino a 20 PC + server", price: 1190, icon: Server },
  ]
}

export default function Section1SystemAssurance({ data, onUpdate, recordIdTrattativa }: Section1Props) {

  const [responseData, setResponseData] = useState<ResponseInterface>(
      isDev ? responseDataDEV : responseDataDEFAULT
  );

  const payload = useMemo(() => {
      if (isDev) return null;
      return {
          apiRoute: 'get_system_assurance_activemind',
          trattativaid: recordIdTrattativa,
      };
  }, [recordIdTrattativa]);

  const { response, loading, error } = !isDev && payload
      ? useApi<ResponseInterface>(payload)
      : { response: null, loading: false, error: null };

  useEffect(() => {
      if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
          setResponseData(response);

          for (const tier of response.tiers) {
            if (tier.selected) {
              onUpdate({
                selectedTier: tier.id,
                price: tier.price,
              });
            }
            setResponseData((prevData) => ({
              ...prevData,
              tiers: prevData.tiers.map((t) => {
                t.icon = Monitor
                return t
              }),
            }));
          }
      }
  }, [response]);


  const handleTierSelect = (tier: (typeof responseData.tiers)[0]) => {
    if (data.selectedTier === tier.id) {
      onUpdate({
        selectedTier: null,
        price: null,
      })
    }else {
      onUpdate({
        selectedTier: tier.id,
        price: tier.price,
      })
    }
  }

  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
    <div className="space-y-6">
      {/* Description */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Shield className="w-8 h-8 md:w-6 md:h-6 lg:w-5 lg:h-5 mr-2" />
            System Assurance tramite RMM di sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">
            Si garantisce continuità, efficienza e sicurezza al sistema informatico con il nostro servizio professionale
            di manutenzione IT programmata, studiato per aziende e professionisti che desiderano concentrarsi sul
            proprio business, lasciando l'infrastruttura tecnologica in mani esperte.
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-12 h-12 md:w-6 md:h-6 lg:w-5 lg:h-5 mr-2" />
            Implementazione degli agent RMM (Remote Monitoring and Management)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>Seleziona il piano più adatto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {response.tiers.map((tier) => {
              const Icon = tier.icon
              const isSelected = data.selectedTier === tier.id

              return (
                <Card
                  key={tier.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" : "hover:border-gray-300"
                  }`}
                  onClick={() => handleTierSelect(tier)}
                >
                  <CardContent className="p-4 text-center">
                    <Icon className={`w-8 h-8 mx-auto mb-3 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
                    <h3 className="font-medium text-sm text-gray-900 mb-2">{tier.label}</h3>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      CHF {tier.price.toLocaleString("it-CH")}.-
                    </div>
                    {isSelected && <Badge className="bg-blue-600 text-white hover:bg-blue-600">Selezionato</Badge>}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {data.selectedTier && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-900">Piano selezionato</h4>
                  <p className="text-sm text-green-700">{response.tiers.find((t) => t.id === data.selectedTier)?.label}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-900">CHF {data.price.toLocaleString("it-CH")}.-</div>
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
