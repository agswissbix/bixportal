"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle2, AlertCircle, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "@/components/genericComponent"

interface Section3Props {
  data: {
    section2: {
      [key: string]: {
         title: string
          quantity: number
          unitPrice: number
          total: number
      }
    }
    section3: {
      selectedFrequency: string,
      exponentPrice?: number
      price?: number
      operationsPerYear?: number
    }
  }
  dealid?: string
  onUpdate: (data: any) => void
}

export const frequencyColors: Record<string, string> = {
  Mensile: "bg-blue-50 border-blue-200 text-blue-900",
  Trimestrale: "bg-green-50 border-green-200 text-green-900",
  Semestrale: "bg-orange-50 border-orange-200 text-orange-900",
  Annuale: "bg-purple-50 border-purple-200 text-purple-900",
};


const conditions = [
  {
    icon: CheckCircle2,
    title: "Intervento in loco programmato",
    description: "Pianificazione ed intervento sull'asset managed dell'uscita precedente",
  },
  {
    icon: AlertCircle,
    title: "Accesso ai dispositivi",
    description: "L'intervento implica la presenza e l'accesso ai device sotto contratto",
  },
  {
    icon: Clock,
    title: "Conferma anticipata",
    description: "L'intervento programmato verrà confermato 3gg prima dell'uscita per evitare incomprensioni",
  },
  {
    icon: Users,
    title: "Rapporto completo",
    description: "Verrà redatto un rapporto completo sullo stato dell'intervento eseguito",
  },
]

const isDev = false

interface ResponseInterface {
  frequencies: Array<{
    id: string;
    label: string;
    description: string;
    icon: string;
    exponentPrice: number;
    price?: number;
    selected?: boolean;
    operationsInOneYear: number;
  }>;
}

const responseDataDEV: ResponseInterface = {
  frequencies: [
    {
      id: "monthly",
      label: "Mensile",
      description: "1 uscita al mese programmato anticipatamente",
      icon: "Calendar",
      exponentPrice: 1,
      operationsInOneYear: 12
    }
  ]
}

const responseDataDEFAULT: ResponseInterface = {
  frequencies: []
};

export default function Section3Conditions({ data, onUpdate, dealid }: Section3Props) {
  const [responseData, setResponseData] = useState<ResponseInterface>(
            isDev ? responseDataDEV : responseDataDEFAULT
        );
    
        const payload = useMemo(() => {
            if (isDev) return null;
            return {
                apiRoute: 'get_conditions_activemind',
                dealid: dealid
            };
        }, [dealid]);
      
        const { response, loading, error } = !isDev && payload
            ? useApi<ResponseInterface>(payload)
            : { response: null, loading: false, error: null };
    
        useEffect(() => {
            if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
                setResponseData(response);
                
                const selectedFreq = response.frequencies.find((freq) => freq.selected);
                if (selectedFreq) {
                  onUpdate({
                    selectedFrequency: selectedFreq.id,
                    exponentPrice: selectedFreq.exponentPrice,
                    price: 0, // Price is explicitly 0
                    operationsPerYear: selectedFreq.operationsInOneYear,
                  });
                  console.log("Selected frequency from response:", selectedFreq);
                }
            }
        }, [response]);


  // Removed section3Total calculation as per requirement

  const handleFrequencySelect = (frequencyId: string, exponentPrice: number) => {
    if (data.section3.selectedFrequency === frequencyId) {
      onUpdate({
        selectedFrequency: null,
        exponentPrice: null,
        price: null,
        operationsPerYear: null
      })
      return
    }
    onUpdate({
      selectedFrequency: frequencyId,
      exponentPrice: exponentPrice,
      price: 0, // Price is explicitly 0
      operationsPerYear: responseData.frequencies.find(freq => freq.id === frequencyId)?.operationsInOneYear || 0
    })
  }

  return (
    <GenericComponent loading={loading} error={error} >
      {(response : ResponseInterface) => (
    <div className="space-y-6">
      {/* Conditions Overview */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-900">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Condizioni incluse in ActiveMind
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {conditions.map((condition, index) => {
              const Icon = condition.icon
              return (
                <div key={index} className="flex items-start space-x-3">
                  <Icon className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">{condition.title}</h4>
                    <p className="text-sm text-amber-800">{condition.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Additional Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Condizioni aggiuntive</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                Eventuali modifiche da parte del cliente devono essere prontamente comunicate (previa modifica
                contrattuale in corso)
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Il valore economico copre prettamente gli interventi programmati</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Gli interventi a regia saranno fatturati secondo accordi a latere</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Seguirà uscita del referente commerciale per un confronto con il cliente sull'operato</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                Gli interventi sui 3/6/12 mesi includeranno possibilmente i mesi di chiusura o di festività per evitare
                il più possibile disservizi
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frequency Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pianificazione intervento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {responseData.frequencies.map((frequency) => {
              // Map icon string to actual Lucide icon component
              const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                Calendar,
                Clock,
                CheckCircle2,
                AlertCircle,
                Users,
              };
              const Icon = iconMap[frequency.icon] || Calendar;
              const isSelected = data.section3.selectedFrequency === frequency.id

              return (
                <Card
                  key={frequency.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" : "hover:border-gray-300"
                  }`}
                  onClick={() => handleFrequencySelect(frequency.id, frequency.price || 0)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${frequencyColors[frequency.id] || 'bg-gray-100 border-gray-200 text-gray-900'} flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{frequency.label}</h3>
                        
                         {/* Price removed */}
                        
                        <p className="text-sm text-gray-600">{frequency.description}</p>
                        {isSelected && <Badge className="mt-2 bg-blue-600 text-white">Selezionato</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
      )}
    </GenericComponent>
  )
}
