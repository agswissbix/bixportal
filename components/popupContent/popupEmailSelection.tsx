import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, User, Building, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { toast } from "sonner";
import { useRecordsStore } from "@/components/records/recordsStore";

interface EmailOption {
  email: string;
  name: string;
  role: string;
  type: string;
}

export default function PopupEmailSelection({ 
  open, 
  onClose, 
  recordid,
  apiRouteGetEmails = "get_timesheet_emails",
  title,
  onConfirm
}: { 
  open: boolean; 
  onClose: () => void; 
  recordid?: string;
  apiRouteGetEmails?: string;
  title?: string;
  onConfirm?: (email: string | null) => void;
}) {
  const popupData = useRecordsStore((state) => state.popupData);
  const popupResolver = useRecordsStore((state) => state.popupResolver);

  const activeApiRoute = apiRouteGetEmails || popupData?.apiRouteGetEmails;
  const activeTitle = title || popupData?.title || "Invia email a:";

  const [emailLoading, setEmailLoading] = useState(false);
  const [emailOptions, setEmailOptions] = useState<EmailOption[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [customEmail, setCustomEmail] = useState<string>("");

  useEffect(() => {
    if (open && activeApiRoute) {
      const fetchEmailOptions = async () => {
        setEmailLoading(true);
        try {
          const response = await axiosInstanceClient.post(
            "/postApi",
            {
              apiRoute: activeApiRoute,
              recordid,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          );
    
          if (response.data?.success) {
            setEmailOptions(response.data.emails || []);
            if (response.data.emails && response.data.emails.length > 0) {
              setSelectedEmail(response.data.emails[0].email);
            }
          }
        } catch (err) {
          console.error("Errore recupero email", err);
          toast.error("Impossibile recuperare le email suggerite");
        } finally {
          setEmailLoading(false);
        }
      };

      fetchEmailOptions();
    }
  }, [open, activeApiRoute, recordid]);

  const handleConfirm = () => {
    let finalEmail = customEmail.trim() ? customEmail : selectedEmail;

    if (!finalEmail) {
      toast.error("Inserire o selezionare un'email di destinazione");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(finalEmail)) {
      toast.error("Formato email non valido");
      return;
    }

    if (onConfirm) {
      onConfirm(finalEmail);
    } else if (popupResolver) {
      popupResolver(finalEmail);
    }
    
    // Reset state before closing
    setCustomEmail("");
    setSelectedEmail("");
    setEmailOptions([]);

    onClose();
  };

  const handleCancel = () => {
    if (onConfirm) {
      onConfirm(null);
    } else if (popupResolver) {
      popupResolver(null); // Resolve with null to indicate cancellation
    }
    setCustomEmail("");
    setSelectedEmail("");
    setEmailOptions([]);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel();
        }
      }}
    >
      <DialogContent className="z-[99999] bg-white text-gray-800 border-none shadow-2xl">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Mail className="w-5 h-5 text-blue-600" />
            {activeTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-5">
          {emailLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm font-medium text-gray-500">Recupero contatti in corso...</p>
            </div>
          ) : (
            <>
              {emailOptions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-600 ml-1">Email suggerite:</p>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {emailOptions.map((opt, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedEmail(opt.email);
                          setCustomEmail("");
                        }}
                        className={cn(
                          "group flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all duration-200",
                          selectedEmail === opt.email && !customEmail
                            ? "border-blue-500 bg-blue-50/50"
                            : "border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30"
                        )}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                            opt.type === "Azienda" ? "bg-amber-100 text-amber-600" : "bg-teal-100 text-teal-600"
                          )}>
                            {opt.type === "Azienda" ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {opt.name || opt.email}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              {opt.type === "Contatto" && opt.role ? `${opt.role} • ` : ""}
                              {opt.email}
                            </span>
                          </div>
                        </div>
                        
                        {selectedEmail === opt.email && !customEmail && (
                          <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 ml-2 animate-in zoom-in" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 uppercase">
                    Oppure inserisci email
                  </span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
                <Input
                  type="email"
                  placeholder="Esempio: mariorossi@azienda.it"
                  value={customEmail}
                  onChange={(e) => {
                    setCustomEmail(e.target.value);
                    if (e.target.value) {
                      setSelectedEmail("");
                    } else if (emailOptions.length > 0) {
                      setSelectedEmail(emailOptions[0].email);
                    }
                  }}
                  className={cn(
                    "w-full px-4 border-gray-200 focus:border-blue-500 rounded-xl h-12 transition-all shadow-sm",
                    customEmail ? "ring-2 ring-blue-500/20 border-blue-500" : ""
                  )}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="border-t border-gray-100 pt-4 sm:justify-between items-center mt-2">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg px-4"
          >
            Annulla
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={emailLoading || (!selectedEmail && !customEmail)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 shadow-md hover:shadow-lg transition-all"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Conferma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
