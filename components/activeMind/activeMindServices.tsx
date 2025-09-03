"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronLeft, ChevronRight, Save, Printer, Check } from "lucide-react"
import CompanyHeader from "./companyHeader"
import Section1SystemAssurance from "./sections/section1SystemAssurance"
import Section2Conditions from "./sections/section2Conditions"
import Section3Services from "./sections/section3Services"
import Section4Summary from "./sections/section4Summary"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import axiosInstance from '@/utils/axiosInstance';

interface ServiceData {
  section1: {
    selectedTier: string
    price: number
  }
  section2: {
    selectedFrequency: string
  }
  section3: {
    [key: string]: {
      title: string,
      quantity: number
      unitPrice: number
      total: number
    }
  }
}

const steps = [
  { id: 1, title: "System Assurance", description: "RMM di sistema" },
  { id: 2, title: "Condizioni", description: "Pianificazione interventi" },
  { id: 3, title: "Servizi", description: "Servizi inclusi" },
  { id: 4, title: "Riepilogo", description: "Definizione economica" },
]

interface propsServices {
  recordIdTrattativa: string;
}

export default function ActiveMindServices({ recordIdTrattativa }: propsServices) {
  const [currentStep, setCurrentStep] = useState(1)
  const [serviceData, setServiceData] = useState<ServiceData>({
    section1: { selectedTier: "", price: 0 },
    section2: { selectedFrequency: "" },
    section3: {},
  })
  const [digitalSignature, setDigitalSignature] = useState<string | null>(null)

  const updateServiceData = useCallback((section: keyof ServiceData, data: any) => {
    setServiceData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }))
  }, [])

  const handleSignatureChange = useCallback((signature: string | null) => {
    setDigitalSignature(signature)
  }, [])

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
          recordIdTrattativa
        }
    
        await axiosInstanceClient.post(
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
    } catch (error) {
        console.error("Errore durante il salvataggio dei dati:", error);
    }
  }

  const handlePrint = async () => {
    try {
        const clientInfo = {
          nome: "Farmacia MGM Azione Sagl",
          indirizzo: "Via Franco Zorzi 36a, Bellinzona",
          data: new Date().toLocaleDateString("it-CH"),
          termine: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString("it-CH")
        }

        const dataToPrint = {
          ...serviceData,
        }
    
        const response = await axiosInstanceClient.post(
            "/postApi",
            {
                apiRoute: "stampa_pdf",
                signature: digitalSignature,
                data: dataToPrint,
                cliente: clientInfo, // TODO: Passare il recordIdTrattativa
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
        console.error("Errore durante il salvataggio dei dati:", error);
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Section1SystemAssurance
            data={serviceData.section1}
            onUpdate={(data) => updateServiceData("section1", data)}
          />
        )
      case 2:
        return (
          <Section2Conditions data={serviceData.section2} onUpdate={(data) => updateServiceData("section2", data)} />
        )
      case 3:
        return <Section3Services data={serviceData.section3} onUpdate={(data) => updateServiceData("section3", data)} />
      case 4:
        return <Section4Summary serviceData={serviceData} onSignatureChange={handleSignatureChange}/>
      default:
        return null
    }
  }

  return (
    <div className="w-full mx-auto p-4 lg:p-8 space-y-6 print:p-0 print:max-w-none max-w-4xl lg:max-w-7xl">
      <CompanyHeader recordIdTrattativa={recordIdTrattativa} />

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
                  onClick={() => {
                    if (
                      (currentStep === 2 && serviceData.section2.selectedFrequency === "")
                    ) {
                      return
                    }
                    setCurrentStep(step.id)
                  }}
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
                  className={"border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent h-12 text-base font-medium" + 
                    (currentStep === 1 ? " invisible" : "")
                  }
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Precedente
                </Button>
              { currentStep === steps.length ? null : 
                <Button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
                >
                  Successivo
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              }
            </div>
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
            <div className="h-24"></div>
          </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex justify-between">
          <Button
            onClick={handlePrevious}
            variant="outline"
            className={"border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent " + 
              (currentStep === 1 ? " invisible" : "")
            }
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Precedente
          </Button>

          <div className="flex items-center space-x-4">
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
            { currentStep !== steps.length ? (
              <Button
                onClick={handleNext}
                disabled={(currentStep === 2 && serviceData.section2.selectedFrequency === "")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
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
