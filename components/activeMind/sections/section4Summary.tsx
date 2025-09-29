import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, FileText, Phone, Mail, Clock } from "lucide-react"
import DigitalSignature from "@/components/activeMind/DigitalSignature"

interface Section4Props {
  serviceData: {
      clientInfo?: {
        nome: string
        indirizzo: string
        data: string
        termine: string
      }
      section1: {
        selectedTier: string
        price: number
      }
      section2Products: {
        [key: string]: {
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
      }
      section2Services: {
        [key: string]: {
          title: string
          quantity: number
          unitPrice: number
          total: number
          features?: string[]
        }
      }
      section3: {
        selectedFrequency: string
        exponentPrice?: number
        operationsPerYear?: number
      }
  }
  onUpdate: (data: any) => void
  onSignatureChange?: (signature: string | null) => void
}

const tierLabels: { [key: string]: string } = {
  tier1: "Fino a 5 PC + server",
  tier2: "Fino a 10 PC + server",
  tier3: "Fino a 15 PC + server",
  tier4: "Fino a 20 PC + server",
}

const frequencyLabels: { [key: string]: string } = {
  monthly: "Mensile (1 uscita al mese)",
  quarterly: "Trimestrale (1 uscita ogni 3 mesi)",
  biannual: "Semestrale (1 uscita ogni 6 mesi)",
  annual: "Annuale (1 uscita ogni 12 mesi)",
}

const serviceLabels: { [key: string]: string } = {
  windowsServerVM: "Windows server (VM)",
  windowsServerPhysical: "Windows server (fisico)",
  clientPC: "Client Personal computer (windows)",
  ups: "Gruppo di continuità",
  rack: "Armadio Rack",
  firewall: "Servizi Firewall",
  wifi: "Rete WIFI (access point)",
  nas: "Storage NAS",
  antivirus: "Servizi di antivirus/EDR",
  backupServer: "Servizi di backup (server)",
  backupClient: "Servizi di backup (client)",
  backup365: "Servizi di backup Microsoft 365",
  tenant365: "Tenant Microsoft 365",
  sharepoint: "Sharepoint/OneDrive",
}

export default function Section4Summary({ serviceData, onUpdate, onSignatureChange }: Section4Props) {
  const section3Total = Object.values(serviceData.section2Services).reduce((sum, service) => sum + service.total, 0)
  const grandTotal = serviceData.section1.price + section3Total

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nome = e.target.value
    onUpdate({
      nome: nome,
    })
  }

  const selectedServices = Object.entries(serviceData.section2Services)
    .filter(([_, service]) => service.quantity > 0)
    .map(([id, service]) => ({ id, ...service }))

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Calculator className="w-5 h-5 mr-2" />
            Definizione Economica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800">Riepilogo completo dei servizi selezionati e calcolo del totale finale.</p>
        </CardContent>
      </Card>

      {/* Section 1 Summary */}
      {serviceData.section1.selectedTier && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sezione 1 - System Assurance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{tierLabels[serviceData.section1.selectedTier]}</h4>
                <p className="text-sm text-gray-600">RMM di sistema (intervento propedeutico)</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">
                  CHF {serviceData.section1.price.toLocaleString("it-CH")}.-
                </div>
                <Badge variant="secondary">Prezzo fisso</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 2 Summary */}
      {selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sezione 2 - Servizi Inclusi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedServices.map((service) => (
                // <>
                // <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                //   <div>
                //     <h4 className="font-medium text-gray-900">{serviceLabels[service.id]}</h4>
                //     <p className="text-sm text-gray-600">
                //       {service.quantity} × CHF {service.unitPrice}
                //     </p>
                //   </div>
                //   <div className="text-right">
                //     <div className="font-bold text-gray-900">CHF {service.total * serviceData.section2Services.exponentPrice!}.-</div>
                //   </div>
                // </div>
                //   {service.features && (
                //     <div className="mt-2 text-sm text-gray-700">
                //       <strong>Caratteristiche:</strong>
                //       <ul className="list-disc list-inside">
                //         {service.features.map((feature, index) => (
                //           <li key={index}>{feature}</li>
                //         ))}
                //       </ul>
                //     </div>
                //   )}
                // </>
                <Card
              key={service.id}
              className={`bg-blue-50 border-blue-200 hover:bg-blue-100 transition-all duration-200`}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div>
                      <CardTitle className="text-lg">{serviceLabels[service.id]}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {service.quantity} × CHF {service.unitPrice}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end space-x-4">

                    <div className="text-right">
                      <div className="font-bold text-gray-900">CHF {service.total * serviceData.section3.exponentPrice!}.-</div>
                    </div>

                    {/* <div className="flex items-center">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </div> */}
                  </div>
                </div>
              </CardHeader>

              
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
            </Card>
              ))}

              {/* <div className="border-t pt-3 mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">Subtotale Servizi</h4>
                  <div className="text-lg font-bold text-gray-900">CHF {section3Total}.-</div>
                </div>
              </div> */}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3 Summary */}
      {serviceData.section3.selectedFrequency && selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sezione 3 - Pianificazione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between p-5 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Frequenza interventi selezionata</h4>
                <p className="text-gray-700">{frequencyLabels[serviceData.section3.selectedFrequency]}</p>
              </div>

              <div className="flex flex-wrap flex-col items-end">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  <span>
                    CHF { (section3Total * serviceData.section3.exponentPrice!) } .-
                  </span>
                  <span className="text-sm font-normal text-gray-600"> / uscita</span>
                </h3>
                <h3 className="font-normal text-md text-gray-900 mb-1">
                  <span>CHF { (section3Total * serviceData.section3.exponentPrice! * serviceData.section3.operationsPerYear!) } .-
                  </span>
                  <span className="text-sm font-normal text-gray-600"> / anno</span>
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grand Total */}
      {/* <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="gap-4 text-sm text-green-800">
              <div className="flex justify-between flex-wrap text-2xl font-bold text-green-900">
                <span>Totale Servizi + Pianificazione:</span>
                <span>CHF { (section3Total * serviceData.section2Services.exponentPrice!) } .-</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Contract Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Condizioni contrattuali di vendita
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Contatti per Assistenza Tecnica
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                  <span>helpdesk@swissbix.ch</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-blue-600" />
                  <span>091 960 22 09</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Lun-Ven: 9:00-12:00, 14:00-17:00</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Metodo di pagamento</h4>
              <p className="text-sm text-gray-700">Fatturazione ad intervento eseguito, pagamento a 20gg</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Condizioni generali</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Condizioni generali di vendita: https://www.swissbix.ch/cgv.pdf</p>
              <p>• Offerta valida fino al {new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString("it-IT")}</p>
              <p>• I prezzi indicati sono IVA Esclusa</p>
              <p>• Sono esclusi: supporto applicativi terze parti, lavori di cablaggio, lavori elettrici</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Massagno, {new Date().toLocaleDateString("it-IT")}</p>
                <p className="font-medium">Mauro Gallani</p>
              </div>
              <div className="flex flex-col text-right">
                <p className="text-sm text-gray-600 mb-2">Per Accettazione</p>
                <input className="float-right block mb-2 border border-gray-300 rounded p-2" 
                  name="name" 
                  placeholder="Nome e Cognome"
                  value={serviceData.clientInfo?.nome || ''}
                  onChange={(e) => handleNameChange(e)}
                />

                <DigitalSignature onSignatureChange={onSignatureChange} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
