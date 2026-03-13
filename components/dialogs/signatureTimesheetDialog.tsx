import React, { useCallback, useState } from "react";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { toast } from "sonner";
import { SignatureDialog } from "../signatureDialog";
import { useRecordsStore } from "@/components/records/recordsStore";
import PopupEmailSelection from "@/components/popupContent/popupEmailSelection";

export default function SignatureDialogWrapper({ recordid, openSignatureDialog, setOpenSignatureDialog }) {
  const [digitalSignature, setDigitalSignature] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [savedSignatureRecordId, setSavedSignatureRecordId] = useState<string | null>(null);

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
          recordid: recordid,
          with_signature: true
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

  const onSendEmailClick = async (recordidAttachment: string) => {
    if (!digitalSignature) {
      toast.error("Nessuna firma digitale rilevata. Si prega di firmare prima di procedere.");
      return;
    }

    setSavedSignatureRecordId(recordidAttachment);
    setShowEmailDialog(true);
  };

  const handleEmailConfirmed = async (finalEmail: string | null) => {
    setShowEmailDialog(false);

    if (!finalEmail) {
      // User cancelled
      return;
    }

    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "save_email_timesheet",
          recordid,
          recordidAttachment: savedSignatureRecordId,
          recipient: finalEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          responseType: "json",
        }
      );

      if (response.status !== 200) {
        toast.error("Errore durante l'invio dell'email.");
        return;
      }

      toast.success("Email inviata con successo.");
    } catch (error) {
      console.error("Errore durante l'invio:", error);
      toast.error("Errore durante l'invio dell'email");
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
    <>
      <SignatureDialog
        isOpen={openSignatureDialog}
        onOpenChange={(open) => {
          setOpenSignatureDialog(open);
        }}
        onSaveSignature={handleSaveSignature}
        onSignatureChange={handleSignatureChange}
        onDownload={(savedSignature) => handlePrintTimesheet(savedSignature)}
        onSendEmail={(savedSignature) => onSendEmailClick(savedSignature)}
      />

      <PopupEmailSelection
        open={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        recordid={recordid}
        apiRouteGetEmails="get_timesheet_emails"
        title="Invia Timesheet a:"
        onConfirm={handleEmailConfirmed}
      />
    </>
  );
}

