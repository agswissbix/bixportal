"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronLeft, ChevronRight, Save, Printer, Check, Home, Section } from "lucide-react"
import InitialChoice from "./sections/section0Choice"
import ProductSelection from "./sections/section2Products"
import { toast } from "sonner"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import CompanyHeader from "./companyHeader"
import Section1SystemAssurance from "./sections/section1SystemAssurance"
import Section3Conditions from "./sections/section3Conditions"
import Section2Services from "./sections/section2Services"
import Section4Summary from "./sections/section4Summary"

interface ServiceData {
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
      quantity: number
      billingType?: "monthly" | "yearly"
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

const systemAssuranceSteps = [
  { id: 1, title: "System Assurance", description: "Analisi infrastruttura IT" },
  { id: 2, title: "Prodotti", description: "Scelta prodotti" },
  { id: 3, title: "Servizi", description: "Scelta Servizi" },
  { id: 4, title: "Condizioni", description: "Pianificazione interventi" },
  { id: 5, title: "Riepilogo", description: "Definizione economica" },
]

const servicesSteps = [
  { id: 1, title: "Selezione Servizi", description: "Scelta servizi" },
  { id: 2, title: "Condizioni", description: "Pianificazione interventi" },
  { id: 3, title: "Riepilogo", description: "Definizione economica" },
]

interface ActiveMindServicesProps {
  recordIdTrattativa?: string
}

export default function ActiveMindServices({ recordIdTrattativa = "default" }: ActiveMindServicesProps) {
  const [chosenPath, setChosenPath] = useState<"system_assurance" | "services" | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [serviceData, setServiceData] = useState<ServiceData>({
    section1: { selectedTier: "", price: 0 },
    section2Products: {},
    section2Services: {},
    section3: { selectedFrequency: "monthly", exponentPrice: 1, operationsPerYear: 12 },
  })
  const [digitalSignature, setDigitalSignature] = useState<string | null>(null)

  const steps = chosenPath === "system_assurance" ? systemAssuranceSteps : servicesSteps

  const updateServiceData = useCallback((section: keyof ServiceData, data: any) => {
    console.log(`Updating ${section} with data:`, data)
    setServiceData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }))
  }, [])

  const handleSignatureChange = useCallback((signature: string | null) => {
    setDigitalSignature(signature)
  }, [])

  const handleInitialChoice = (choice: "system_assurance" | "services") => {
    setChosenPath(choice)
    setCurrentStep(1)
  }

  const handleBackToChoice = () => {
    setChosenPath(null)
    setCurrentStep(1)
    setServiceData({
      section1: { selectedTier: "", price: 0 },
      section2Services: {},
      section2Products: {},
      section3: { selectedFrequency: "monthly", exponentPrice: 1, operationsPerYear: 12 },
    })
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSave = async () => {
    try {
      const dataToSave = {
        ...serviceData,
        digitalSignature,
        recordIdTrattativa,
        chosenPath,
      }

      const result = await axiosInstanceClient.post(
          "/postApi",
          {
              apiRoute: "save_activemind",
              data: dataToSave,
          },
          {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
          }
      );

      if (result.status === 200) {
        toast.success("Dati salvati con successo!")
      }
    } catch (error) {
      console.error("Errore durante il salvataggio dei dati:", error)
      toast.error("Errore durante il salvataggio")
    }
  }

  const handlePrint = async () => {
    try {
      const dataToPrint = {
        ...serviceData,
        clientInfo: {
          nome: serviceData.clientInfo?.nome || "N/A",
          indirizzo: serviceData.clientInfo?.indirizzo || "N/A",
          data: serviceData.clientInfo?.data || new Date().toLocaleDateString(),
        },
        products: Object.entries(serviceData.section2Products || {}).map(([id, product]) => ({
          id,
          quantity: product.quantity,
          billingType: product.billingType,
        })),
        services: Object.entries(serviceData.section2Services || {}).map(([id, service]) => ({
          id,
          quantity: service.quantity,
        })),
        conditions: serviceData.section3.selectedFrequency,
      }

      const response = await axiosInstanceClient.post(
          "/postApi",
          {
              apiRoute: "print_pdf_activemind",
              signature: digitalSignature,
              data: dataToPrint,
              idTrattativa: recordIdTrattativa,
              nameSignature: serviceData.clientInfo?.nome || ''
          },
          {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
          }
      );

      if (response.status === 200) {
          const blob = new Blob([response.data], { type: "application/pdf" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `ActiveMind_Preventivo_${new Date().toISOString().split("T")[0]}.pdf`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } else {
          throw new Error("Errore nella generazione del PDF")
        }
    } catch (error) {
      console.error("Errore durante la stampa:", error)
      toast.error("Errore durante la generazione del PDF")
    }
  }

  const renderStepContent = () => {
    if (chosenPath === "system_assurance") {
      switch (currentStep) {
        case 1:
          return (
            <Section1SystemAssurance data={serviceData.section1} onUpdate={(data) => updateServiceData("section1", data)} />
          )
        case 2:
          return (
            <ProductSelection data={serviceData.section2Products} onUpdate={(data) => updateServiceData("section2Products", data)} />
          )
        case 3:
          return (
            <Section2Services data={serviceData.section2Services} onUpdate={(data) => updateServiceData("section2Services", data)} />
          )
        case 4:
          return <Section3Conditions data={{ section3: serviceData.section3, section2: serviceData.section2Services }} onUpdate={(data) => updateServiceData("section3", data)} />
        case 5:
          return <Section4Summary serviceData={serviceData} onUpdate={(data) => updateServiceData("clientInfo", data)} onSignatureChange={handleSignatureChange} />
        default:
          return null
      }
    } else if (chosenPath === "services") {
      switch (currentStep) {
        case 1:
          return (
            <Section2Services data={serviceData.section2Services} onUpdate={(data) => updateServiceData("section2Services", data)} />
          )
        case 2:
          return <Section3Conditions data={{ section3: serviceData.section3, section2: serviceData.section2Services }} onUpdate={(data) => updateServiceData("section3", data)} />
        case 3:
          return <Section4Summary serviceData={serviceData} onUpdate={(data) => updateServiceData("clientInfo", data)} onSignatureChange={handleSignatureChange} />
        default:
          return null
      }
    }
    return null
  }

  if (!chosenPath) {
    return (
      <div className="w-full mx-auto p-4 lg:p-8 space-y-6 max-w-6xl">
        <CompanyHeader recordIdTrattativa={recordIdTrattativa} />
        <InitialChoice onChoice={handleInitialChoice} />
      </div>
    )
  }

  return (
    <div className="w-full mx-auto p-4 lg:p-8 space-y-6 print:p-0 print:max-w-none max-w-4xl lg:max-w-7xl">
      <CompanyHeader recordIdTrattativa={recordIdTrattativa} />

      <Button
        variant="outline"
        className="print:hidden"
        onClick={handleBackToChoice}
      >
        <Home className="w-4 h-4 mr-2" />
        Torna alla scelta iniziale
      </Button>

      {/* Stepper Navigation */}
      <div className="print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center mb-8 space-y-4 lg:space-y-0">
          {/* Mobile: Vertical compact stepper */}
          <div className="lg:hidden bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex flex-col">
              {/* Current step - full size */}
              <div className="flex items-center justify-between space-x-3 p-5">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center items-end w-10 h-10 rounded-full bg-blue-600 text-white">
                    <span className="text-md font-medium">{currentStep}</span>
                  </div>
                  <div>
                    <p className="text-md font-medium text-blue-600">{steps[currentStep - 1].title}</p>
                    <p className="text-sm text-gray-500">{steps[currentStep - 1].description}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-auto text-sm print:hidden">
                  {currentStep}/{steps.length}
                </Badge>
              </div>

              {/* Other steps - compact */}
              <div className="flex items-center justify-center space-x-1 space-y-0 mb-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <div
                          className={`flex items-center justify-center w-6 h-6 rounded-full border cursor-pointer ${
                            currentStep === step.id
                              ? "bg-blue-600 border-blue-600 text-white"
                              : currentStep > step.id
                                ? "bg-green-600 border-green-600 text-white"
                                : "border-gray-300 text-gray-400"
                          }`}
                        >
                          {currentStep > step.id ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <span className="text-xs">{step.id}</span>
                          )}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="bg-gray-100 text-gray-900 border border-gray-300 max-w-max p-3">
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-xs text-gray-600">{step.description}</p>
                      </PopoverContent>
                    </Popover>
                    {index < steps.length - 1 && (
                      <div className={`w-4 h-0.5 mx-1 ${currentStep > step.id ? "bg-green-600" : "bg-gray-300"}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: Horizontal stepper */}
          <div className="hidden lg:flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer ${
                    currentStep === step.id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : currentStep > step.id
                        ? "bg-green-600 border-green-600 text-white"
                        : "border-gray-300 text-gray-500"
                  }`}
                  onClick={() => setCurrentStep(step.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Vai allo step ${step.title}`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${currentStep === step.id ? "text-blue-600" : "text-gray-500"}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${currentStep > step.id ? "bg-green-600" : "bg-gray-300"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="print:pb-2">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">{steps[currentStep - 1].title}</CardTitle>
              <p className="text-gray-600 mt-1">{steps[currentStep - 1].description}</p>
            </div>
            <Badge variant="secondary" className="print:hidden self-start lg:self-center lg:block hidden">
              Sezione {currentStep} di {steps.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="print:pt-0">{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="print:hidden">
        {/* Mobile Layout */}
        <div className="flex flex-col space-y-3 sm:hidden">
          <div className="flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              variant="outline"
              className={
                "border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent h-12 text-base font-medium" +
                (currentStep === 1 ? " invisible" : "")
              }
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Precedente
            </Button>
            {currentStep === steps.length ? null : (
              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
              >
                Successivo
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
          {currentStep === steps.length && (
            <div className="flex justify-center space-x-4">
              <Button
                onClick={handleSave}
                variant="outline"
                className="bg-green-50 hover:bg-green-200 text-green-900 w-1/2 h-12 text-base font-medium"
              >
                <Save className="w-5 h-5 mr-2" />
                Salva
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="text-gray-700 hover:bg-gray-50 bg-transparent w-1/2 h-12 text-base font-medium"
              >
                <Printer className="w-5 h-5 mr-2" />
                Stampa PDF
              </Button>
            </div>
          )}
          <div className="h-24"></div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex justify-between">
          <Button
            onClick={handlePrevious}
            variant="outline"
            className={
              "border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent " + (currentStep === 1 ? " invisible" : "")
            }
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Precedente
          </Button>

          <div className="flex items-center space-x-4">
            {currentStep === steps.length && (
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="text-gray-700 hover:bg-gray-50 bg-transparent"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Stampa PDF
                </Button>
                <Button
                  onClick={handleSave}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-200 text-green-900"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salva
                </Button>
              </div>
            )}
            {currentStep !== steps.length ? (
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white">
                Successivo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
