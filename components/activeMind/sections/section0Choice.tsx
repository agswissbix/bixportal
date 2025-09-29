"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, ShoppingCart, ArrowRight, CheckCircle } from "lucide-react"

interface InitialChoiceProps {
  onChoice: (choice: "system_assurance" | "services") => void
}

export default function InitialChoice({ onChoice }: InitialChoiceProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Che tipo di analisi vuoi effettuare?</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {/* System Assurance Option */}
        <Card
          className="bg-blue-50 border-blue-200 hover:bg-blue-100 transition-all duration-200 cursor-pointer group"
          onClick={() => onChoice("system_assurance")}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">System Assurance</CardTitle>
                <Badge variant="secondary" className="mt-1">
                    Analisi infrastruttura IT
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Si garantisce continuità, efficienza e sicurezza al sistema informatico con il nostro servizio professionale di manutenzione IT programmata, studiato per aziende e professionisti che desiderano concentrarsi sul proprio business, lasciando l'infrastruttura tecnologica in mani esperte.

            </p>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Include:</h4>
              <div className="space-y-1">
                {[
                  "Installazione agent RMM (1 mese)",
                  "Avvio e riesamina dello stato dei PC",
                  "Generazione di un Asset managed (inventario)",
                  "Verifica infrastruttura informatica",
                  "Device networking",
                  "Nas/storage",
                  "Switch/router",
                  "Reportistica sull'infrastruttura informatica"
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-100 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium">
                Ideale per un nuovo cliente
              </p>
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:bg-blue-700"
              onClick={(e) => {
                e.stopPropagation()
                onChoice("system_assurance")
              }}
            >
              Inizia con System Assurance
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Services Selection Option */}
        <Card
          className="bg-green-50 border-green-200 hover:bg-green-100 transition-all duration-200 cursor-pointer group"
          onClick={() => onChoice("services")}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-3 bg-green-600 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-green-900">Scelta dei Servizi</CardTitle>
                <Badge variant="secondary" className="mt-1">
                  Configurazione diretta
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Vai direttamente alla selezione dei servizi IT se conosci già le tue esigenze e vuoi configurare
              rapidamente la tua soluzione.
            </p>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Categorie disponibili:</h4>
              <div className="space-y-1">
                {[
                  "Sicurezza dati informatici (nLPD)",
                  "Sicurezza dati mobili",
                  "Sicurezza infrastruttura",
                  "Protezione email e phishing",
                  "Firewall e networking",
                ].map((category, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{category}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-100 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium">Configurazione rapida con preventivo immediato</p>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white group-hover:bg-green-700"
              onClick={(e) => {
                e.stopPropagation()
                onChoice("services")
              }}
            >
              Scegli i Servizi
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">Puoi sempre cambiare percorso durante la configurazione</p>
      </div>
    </div>
  )
}
