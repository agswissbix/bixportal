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
        <h1 className="text-3xl font-bold text-gray-900">Proposta soluzioni IT per gli studi medici</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Scegli il percorso più adatto alle tue esigenze per configurare la tua soluzione IT personalizzata
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {/* System Assurance Option */}
        <Card
          className="bg-blue-50 border-blue-200 hover:bg-blue-100 transition-all duration-200 cursor-pointer group flex flex-col"
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
          <CardContent className="space-y-4 flex-1 flex flex-col">
            <p className="text-gray-700">
              Analisi completa dell'infrastruttura IT per garantire continuità, efficienza e sicurezza al sistema
              informatico con manutenzione programmata.
            </p>

            <div className="space-y-2 flex-1">
              <h4 className="font-medium text-gray-900">Include:</h4>
              <div className="space-y-1">
                {[
                  "Installazione agent RMM (1 mese)",
                  "Verifica infrastruttura e networking",
                  "Inventario hardware/software completo",
                  "Reportistica dettagliata",
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
                Ideale per nuovi clienti
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
          className="bg-amber-50 border-amber-200 hover:bg-amber-100 transition-all duration-200 cursor-pointer group flex flex-col"
          onClick={() => onChoice("services")}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-3 bg-amber-600 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-amber-900">Manutenzione e Assistenza</CardTitle>
                <Badge variant="secondary" className="mt-1">
                  Servizi continuativi
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col">
            <p className="text-gray-700">
              Servizi di manutenzione programmata e assistenza IT continuativa per proteggere e ottimizzare la tua
              infrastruttura nel tempo.
            </p>

            <div className="space-y-2 flex-1">
              <h4 className="font-medium text-gray-900">Servizi disponibili:</h4>
              <div className="space-y-1">
                {[
                  "Monitoraggio e gestione remota (RMM)",
                  "Backup automatici e disaster recovery",
                  "Protezione antivirus e anti-ransomware",
                  "Sicurezza email e formazione phishing",
                ].map((category, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{category}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-100 rounded-lg p-3">
              <p className="text-sm text-amber-800 font-medium">
                Configurazione rapida con preventivo immediato
              </p>
            </div>

            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white group-hover:bg-amber-700"
              onClick={(e) => {
                e.stopPropagation()
                onChoice("services")
              }}
            >
              Configura i Servizi
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
