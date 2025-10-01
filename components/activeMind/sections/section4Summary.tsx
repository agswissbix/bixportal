"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, FileText, Phone, Mail, Clock, Package, Settings, Calendar } from "lucide-react"
import DigitalSignature from "@/components/activeMind/DigitalSignature"

interface SummarySectionProps {
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
        title: string
        quantity: number
        unitPrice: number
        total: number
        features?: string[]
        category?: "data_security" | "mobile_security" | "infrastructure" | "sophos" | "microsoft" | "firewall"
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

const categoryLabels: { [key: string]: string } = {
  data_security: "Sicurezza Dati Informatici",
  mobile_security: "Sicurezza Dati Mobili",
  infrastructure: "Sicurezza Infrastruttura",
  sophos: "Servizi Sophos",
  microsoft: "Licenze Microsoft",
  firewall: "Firewall",
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

export default function SummarySection({ serviceData, onUpdate, onSignatureChange }: SummarySectionProps) {
  const servicesTotal = Object.values(serviceData.section2Services).reduce((sum, service) => sum + service.total, 0)
  const productsTotal = Object.values(serviceData.section2Products).reduce((sum, product) => sum + product.total, 0)
  const annualTotal = Object.values(serviceData.section2Products)
    .reduce((sum, product: any) => 
      sum + (product.billingType === "yearly" && product.yearlyPrice 
        ? product.yearlyPrice * product.quantity 
        : 0), 
    0)

  const monthlyTotal = Object.values(serviceData.section2Products)
    .reduce((sum, product: any) => 
      sum + (product.billingType === "monthly" && product.monthlyPrice 
        ? product.monthlyPrice * product.quantity 
        : 0), 
    0)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nome = e.target.value
    console.log("Name changed:", nome)
    onUpdate({
      nome: nome,
    })
  }

  const selectedServices = Object.entries(serviceData.section2Services)
    .filter(([_, service]) => service.quantity > 0)
    .map(([id, service]) => ({ id, ...service }))

  const selectedProducts = Object.entries(serviceData.section2Products)
    .filter(([_, product]) => product.quantity > 0)
    .map(([id, product]) => ({ id, ...product }))

  const productsByCategory = selectedProducts.reduce(
    (acc, product) => {
      const category = product.category || "infrastructure"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(product)
      return acc
    },
    {} as Record<string, typeof selectedProducts>,
  )

  const hasSystemAssuranceOrProducts = serviceData.section1.selectedTier || selectedProducts.length > 0
  const hasServicesOrPlanning = selectedServices.length > 0 || serviceData.section3.selectedFrequency

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <Calculator className="w-5 h-5 mr-2" />
            Definizione Economica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-800">Riepilogo completo dei servizi selezionati e calcolo del totale finale.</p>
        </CardContent>
      </Card>

      {/* Section 1 Summary - System Assurance */}
      {serviceData.section1.selectedTier && (
        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-700" />
              System Assurance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-l-4 border-blue-500">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">{tierLabels[serviceData.section1.selectedTier]}</h4>
                    <p className="text-sm text-gray-600 mt-1">RMM di sistema (intervento propedeutico)</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      CHF {serviceData.section1.price.toLocaleString("it-CH")}.-
                    </div>
                    <Badge variant="secondary" className="mt-1">Prezzo fisso</Badge>
                  </div>
                </div>
          </CardContent>
        </Card>
      )}

      {/* Section 2 Products */}
      {selectedProducts.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <Package className="w-5 h-5 mr-2 text-indigo-700" />
                Prodotti Selezionati
              </div>
              <Badge variant="outline" className="bg-white">
                {selectedProducts.length} {selectedProducts.length === 1 ? "prodotto" : "prodotti"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {Object.entries(productsByCategory).map(([category, products]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-md font-semibold text-gray-900">{categoryLabels[category]}</h3>
                    <Badge variant="outline" className="text-xs">
                      {products.length} {products.length === 1 ? "prodotto" : "prodotti"}
                    </Badge>
                  </div>

                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className="bg-indigo-50 border-indigo-200 hover:bg-indigo-100 transition-all duration-200"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                          <div className="flex items-center space-x-3">
                            <div>
                              <CardTitle className="text-lg">{product.title}</CardTitle>
                              <div className="flex items-center space-x-2 mt-1">
                                <p className="text-sm text-gray-600">
                                  {product.quantity} × CHF {product.unitPrice}
                                </p>
                                {product.monthlyPrice && (
                                  <Badge variant="outline" className="text-xs">
                                    {product.monthlyPrice}/mese
                                  </Badge>
                                )}
                                {product.yearlyPrice && (
                                  <Badge variant="outline" className="text-xs">
                                    {product.yearlyPrice}/anno
                                  </Badge>
                                )}
                              </div>
                              {product.description && (
                                <p className="text-xs text-gray-500 mt-1">{product.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-gray-900">CHF {product.total}.-</div>
                            <div className="text-xs text-gray-600">Totale</div>
                          </div>
                        </div>
                      </CardHeader>

                      {product.features && product.features.length > 0 && (
                        <CardContent className="pt-0">
                          <div className="bg-white/70 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">Servizi inclusi:</h4>
                            <div className="grid gap-2 lg:grid-cols-2">
                              {product.features.map((feature, index) => (
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
                  ))}
                </div>
              ))}

              {/* Subtotale Prodotti */}
              <div className="border-t-2 border-indigo-200 pt-4 mt-4">
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-300 rounded-xl shadow-inner">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-base mb-2">Subtotale prodotti</h4>
                      <p className="text-gray-700 text-lg font-medium">{frequencyLabels[serviceData.section3.selectedFrequency]}</p>
                    </div>

                    <div className="flex flex-col items-end space-y-2 bg-white/60 p-4 rounded-lg">
                      <div className="text-right">
                          {monthlyTotal > 0 && (
                            <>
                              <h3 className="text-2xl font-bold text-gray-900">
                                    <div className="text-2xl font-bold text-indigo-900">CHF {monthlyTotal.toFixed(2)}.-</div>
                              </h3>
                        <p className="text-sm text-gray-600">totale mensile</p>
                            </>
                          )}
                      </div>
                      <div className="text-right border-t pt-2">
                          {annualTotal > 0 && (
                            <>
                        <h3 className="text-xl font-semibold text-amber-700">
                          
                              <div className="text-2xl font-bold text-indigo-900">CHF {annualTotal.toFixed(2)}.-</div>
                        </h3>
                        <p className="text-sm text-gray-600">totale annuo</p>
                            </>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 2 Services */}
      {selectedServices.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-amber-700" />
                Servizi Inclusi
              </div>
              <Badge variant="outline" className="bg-white">
                {selectedServices.length} {selectedServices.length === 1 ? "servizio" : "servizi"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {selectedServices.map((service) => (
                <Card
                  key={service.id}
                  className="bg-amber-50 border-amber-200 hover:bg-amber-100 transition-all duration-200"
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

                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          CHF {service.total * (serviceData.section3.exponentPrice || 1)}.-
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {service.features && service.features.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="bg-white/70 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Servizi inclusi:</h4>
                        <div className="grid gap-2 lg:grid-cols-2">
                          {service.features.map((feature, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3 Summary - Planning */}
      {serviceData.section3.selectedFrequency && selectedServices.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-700" />
              Pianificazione
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl shadow-inner">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                  <h4 className="font-semibold text-gray-900 text-base mb-2">Frequenza interventi selezionata</h4>
                  <p className="text-gray-700 text-lg font-medium">{frequencyLabels[serviceData.section3.selectedFrequency]}</p>
                </div>

                <div className="flex flex-col items-end space-y-2 bg-white/60 p-4 rounded-lg">
                  <div className="text-right">
                    <h3 className="text-2xl font-bold text-gray-900">
                      CHF {(servicesTotal * (serviceData.section3.exponentPrice || 1)).toFixed(2)} .-
                    </h3>
                    <p className="text-sm text-gray-600">per uscita</p>
                  </div>
                  <div className="text-right border-t pt-2">
                    <h3 className="text-xl font-semibold text-amber-700">
                      CHF{" "}
                      {(
                        servicesTotal *
                        (serviceData.section3.exponentPrice || 1) *
                        (serviceData.section3.operationsPerYear || 12)
                      ).toFixed(2)}{" "}
                      .-
                    </h3>
                    <p className="text-sm text-gray-600">totale annuo</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Terms */}
      <div className="border-t-4 border-gray-300 pt-8 mt-8">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-50 mb-3 rounded-t-lg">
            <CardTitle className="flex items-center text-xl">
              <FileText className="w-6 h-6 mr-2" />
              Condizioni Contrattuali di Vendita
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
              <p>
                • Offerta valida fino al {new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString("it-IT")}
              </p>
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
                <input
                  className="float-right block mb-2 border border-gray-300 rounded p-2"
                  name="name"
                  placeholder="Nome e Cognome"
                  value={serviceData.clientInfo?.nome || ""}
                  onChange={(e) => handleNameChange(e)}
                />

                <DigitalSignature onSignatureChange={onSignatureChange} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}