"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Save, Printer, Check } from "lucide-react"
import CompanyHeader from "./companyHeader"
import Section1SystemAssurance from "./sections/section1SystemAssurance"
import Section2Conditions from "./sections/section2Conditions"
import Section3Services from "./sections/section3Services"
import Section4Summary from "./sections/section4Summary"
import axiosInstanceClient from "@/utils/axiosInstance"

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

export default function ActiveMindServices() {
  const [currentStep, setCurrentStep] = useState(1)
  const [serviceData, setServiceData] = useState<ServiceData>({
    section1: { selectedTier: "", price: 0 },
    section2: { selectedFrequency: "" },
    section3: {},
  })

  const updateServiceData = useCallback((section: keyof ServiceData, data: any) => {
    setServiceData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }))
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
          timestamp: new Date().toISOString(),
          cliente: "Farmacia MGM Azione Sagl",
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

  const handlePrint = () => {
    window.print()
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
        return <Section4Summary serviceData={serviceData} />
      default:
        return null
    }
  }

  return (
    <div className="w-full mx-auto p-4 lg:p-8 space-y-6 print:p-0 print:max-w-none max-w-4xl lg:max-w-7xl">
      <CompanyHeader />

      {/* Stepper Navigation */}
      <div className="print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-2 lg:space-x-4 overflow-x-auto pb-2 lg:pb-0">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep === step.id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : currentStep > step.id
                        ? "bg-green-600 border-green-600 text-white"
                        : "border-gray-300 text-gray-500"
                  }`}
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
                  <div
                    className={`w-8 lg:w-12 h-0.5 mx-2 lg:mx-4 ${currentStep > step.id ? "bg-green-600" : "bg-gray-300"}`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              onClick={handleSave}
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
            >
              <Save className="w-4 h-4 mr-2" />
              Salva
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
            >
              <Printer className="w-4 h-4 mr-2" />
              Stampa PDF
            </Button>
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
            <Badge variant="secondary" className="print:hidden self-start lg:self-center">
              Sezione {currentStep} di {steps.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="print:pt-0">{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between print:hidden">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Precedente
        </Button>

        <Button
          onClick={handleNext}
          disabled={currentStep === steps.length}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Successivo
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
