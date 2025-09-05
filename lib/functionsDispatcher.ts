// functionsDispatcher.ts
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { toast } from "sonner"

export const frontendFunctions: Record<string, (...args: any[]) => Promise<any>> = {
  crea_lista_lavanderie: async (mese: string) => {
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "crea_lista_lavanderie",
          mese,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )
      toast.success("Record creati")
      return response.data
    } catch (error) {
      console.error("Errore durante la creazione dei record", error)
      toast.error("Errore durante la creazione dei record")
    }
  },
  compilaActiveMind: async (recordid: string) => {
    console.log("Eseguendo funzione:", "compilaActiveMind", "con parametri:", {recordid});
    window.open(`/activeMind/${recordid}`, "_blank");
  }
}
