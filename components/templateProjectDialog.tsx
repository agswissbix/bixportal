"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { useApi } from "@/utils/useApi"
import GenericComponent from "./genericComponent"
import { useRecordsStore } from "./records/recordsStore"

const isDev = false

type DialogProps = {
  open: boolean
  onClose: (value: any) => void
  recordid?: string
}

interface ResponseInterface {
  templates: { id: string; value: string }[]
}

export function TemplateSelectionDialog({ open, onClose, recordid }: DialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [responseData, setResponseData] = useState<ResponseInterface>()
  const [loadingSaving, setLoadingSaving] = useState(false)

  const {setRefreshTable, handleRowClick } = useRecordsStore()

  const payload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "get_project_templates",
    }
  }, [])

  const { response, loading, error } =
    !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null }

  useEffect(() => {
    if (!isDev && response) {
      setResponseData(response)
    }
  }, [response])

  // ⚡ SALVATAGGIO DIRETTO
  const saveTemplate = async () => {
    try {
      setLoadingSaving(true)

      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "save_project_as_template",
          recordid,
          template: selectedTemplate,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (response.data.error) {
        toast.error("Errore: " + response.data.error)
        return
      }

      toast.success("Template applicato al progetto!")
      onClose(selectedTemplate)
      handleRowClick('standard', recordid, 'project');
    } catch (error) {
      toast.error("Errore durante il salvataggio")
      console.error(error)
    } finally {
      setLoadingSaving(false)
      setRefreshTable((v) => v+1)
    }
  }

  const handleCancel = () => {
    setSelectedTemplate("")
    onClose(null)
  }

  return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
          <DialogContent className="sm:max-w-md space-y-2">
            <DialogHeader>
              <DialogTitle>Seleziona Template Progetto</DialogTitle>
              <DialogDescription>
                Scegli un template da applicare.  
                <br />
                <br />
                <span className="text-red-600 font-medium">
                  Attenzione: i dati del progetto verranno sovrascritti con quelli del template scelto.
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <GenericComponent response={responseData} loading={loading} error={error}>
                {(response: ResponseInterface) => (
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Seleziona un template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {response?.templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                )}
                </GenericComponent>
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancel}>
                Annulla
              </Button>
              <Button disabled={!selectedTemplate || loadingSaving} onClick={saveTemplate}>
                {loadingSaving ? "Salvataggio..." : "Conferma"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  )
}
