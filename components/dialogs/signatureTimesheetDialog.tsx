import React, { useCallback, useState } from "react";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { toast } from "sonner";
import { SignatureDialog } from "../signatureDialog";

export default function SignatureDialogWrapper({ recordid, openSignatureDialog, setOpenSignatureDialog }) {
  const [digitalSignature, setDigitalSignature] = useState<string | null>(null);

  const handleSignatureChange = useCallback((signature: string | null) => {
    setDigitalSignature(signature);
  }, []);

  const handlePrintTimesheet = async (recordidAttachment: string) => {
    if (!digitalSignature) {
      toast.error("Nessuna firma digitale rilevata. Si prega di firmare prima di procedere.");
      return;
    }

    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "print_timesheet",
          recordid: recordidAttachment,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "timesheet_" + recordid + ".pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Errore durante il salvataggio o il download:", error);
      toast.error("Errore durante il salvataggio o il download");
    }
  };

  const handleSendEmailTimesheet = async (recordidAttachment: string) => {
    if (!digitalSignature) {
      toast.error("Nessuna firma digitale rilevata. Si prega di firmare prima di procedere.");
      return;
    }

    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "save_email_timesheet",
          recordid,
          recordidAttachment,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          responseType: "blob",
        }
      );

      if (response.status !== 200) {
        toast.error("Errore durante l'invio dell'email.");
        return;
      }

      toast.success("Email inviata con successo.");
    } catch (error) {
      console.error("Errore durante il salvataggio o il download:", error);
      toast.error("Errore durante il salvataggio o il download");
    }
  };

  const handleSaveSignature = async () => {
    if (!digitalSignature) {
      toast.error("Nessuna firma digitale rilevata. Si prega di firmare prima di procedere.");
      return;
    }

    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "save_signature",
          recordid,
          image: digitalSignature,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.error) {
        toast.error("Errore durante il salvataggio della firma: " + response.data.error);
        return;
      }

      toast.success("Firma salvata con successo.");
      return response.data.attachment_recordid;
    } catch (error) {
      console.error("Errore durante il salvataggio o il download:", error);
      toast.error("Errore durante il salvataggio o il download");
    }
  };

  return (
    <SignatureDialog
      isOpen={openSignatureDialog}
      onOpenChange={setOpenSignatureDialog}
      onSaveSignature={handleSaveSignature}
      onSignatureChange={handleSignatureChange}
      onDownload={(savedSignature) => handlePrintTimesheet(savedSignature)}
      onSendEmail={(savedSignature) => handleSendEmailTimesheet(savedSignature)}
    />
  );
}
