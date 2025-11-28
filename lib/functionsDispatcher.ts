// functionsDispatcher.ts
import { useRecordsStore } from "@/components/records/recordsStore"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { toast } from "sonner"
    
export function useFrontendFunctions() {
  const {removeCard, handleRowClick, setPopupRecordId, setRefreshTable, setIsPopupOpen, setPopUpType, setOpenSignatureDialog } = useRecordsStore()
        
  return {
  // ----------------------- results functions ------------------------
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
  // ----------------------- recordCards functions ------------------------
  compilaActiveMind: async ({ recordid }: { recordid: string }) => {
    window.open(`/activeMind/${recordid}`, "_blank");
  },
  handleSignTimesheet: async () => {
    setOpenSignatureDialog(true);
  },
  stampaBollettino: async ({ recordid }: { recordid: string }) => {
    try {
      //download a file from the response
      //const response = await axiosInstance.post('/customapp_pitservice/stampa_bollettino_test/', { recordid }, {responseType: 'blob'});
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "stampa_bollettino",
          recordid: recordid,
        },
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const contentDisposition = response.headers['content-disposition'] || '';
      let filename = 'bollettino-standard.pdf';

      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      toast.success('Bollettino stampato con successo');

    } catch (error) {
      console.error('Errore durante la stampa del bollettino', error);
      toast.error('Errore durante la stampa del bollettino');
    }
  },
  swissbixPrintTimesheet: async ({ recordid }: { recordid: string }) => {
    try {
      //download a file from the response
      //const response = await axiosInstance.post('/customapp_pitservice/stampa_bollettino_test/', { recordid }, {responseType: 'blob'});
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "print_timesheet",
          recordid: recordid,
        },
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const contentDisposition = response.headers['content-disposition'] || '';
      let filename = 'timesheet.pdf';

      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      toast.success('Timesheet stampato con successo');

    } catch (error) {
      console.error('Errore durante la stampa del timesheet', error);
      toast.error('Errore durante la stampa del timesheet');
    }
  },
  downloadOfferta: async ({ recordid }: { recordid: string }) => {
    try {
      const response = await axiosInstanceClient.post(
          "/postApi",
          {
              apiRoute: "download_offerta",
              recordid: recordid,
          },
          {
              responseType: "blob",
              headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
          }
      )
      //toast.success('Record creati');
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      
      // Estrai il filename dal header Content-Disposition
      const contentDisposition = response.headers['content-disposition'] || '';
      let filename = 'offerta.doc';
      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
      
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
    } catch (error) {
        console.error('Errore durante la creazione dei record', error);
        toast.error('Errore durante la creazione dei record');
    }
  },
  stampaPdfTest: async ({ recordid }: { recordid: string }) => {
    try {
      //download a file from the response
      //const response = await axiosInstance.post('/customapp_pitservice/stampa_bollettino_test/', { recordid }, {responseType: 'blob'});
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "stampa_pdf_test",
          recordid: recordid,
        },
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const contentDisposition = response.headers['content-disposition'] || '';
      let filename = 'pdftest.pdf';

      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      toast.success('PDF test stampato con successo');

    } catch (error) {
      console.error('Errore durante la stampa del PDF test', error);
      toast.error('Errore durante la stampa del PDF test');
    }

  },
  swissbixStampaOfferta: async ({ recordid }: { recordid: string }) => {
    try {
      //download a file from the response
      //const response = await axiosInstance.post('/customapp_pitservice/stampa_bollettino_test/', { recordid }, {responseType: 'blob'});
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "swissbix_stampa_offerta",
          recordid: recordid,
        },
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const contentDisposition = response.headers['content-disposition'] || '';
      let filename = 'pdftest.pdf';

      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      toast.success('PDF test stampato con successo');

    } catch (error) {
      console.error('Errore durante la stampa del PDF test', error);
      toast.error('Errore durante la stampa del PDF test');
    }
    
  },
  sendEmail: async ({ recordid }: { recordid: string }) => {
    try {
      await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "send_emails",
          recordid: recordid,
        },

        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success('Email inviata con successo');
    } catch (error) {
      console.error("Errore durante l'invio della email", error);
      toast.error("Errore durante l'invio della email");
    }
  },
  handleRendiContoLavanderia: async ({ recordid }: { recordid: string }) => {
    
    setPopupRecordId(recordid);
    setIsPopupOpen(true);
    setPopUpType('emailLavanderia');
  },
  handleStabile: async ({ recordid }: { recordid: string }) => {
    setPopupRecordId(recordid);
    setIsPopupOpen(true);
    setPopUpType('reportGasolio');
  },
  handleBollettiniTrasporto: async ({ recordid }: { recordid: string }) => {
    setPopupRecordId(recordid);
    setIsPopupOpen(true);
    setPopUpType('emailBollettini');
  },
  printingInvoice: async ({ recordid }: { recordid: string }) => {
    window.open(`http://bixcrm01:8822/bixdata/custom/api_bexio_set_printing_invoices.php?recordid=${recordid}`, '_blank')
  },
  swissbix_deal_update_status: async (params: object) => {
      try {
        const response = await axiosInstanceClient.post(
          "/postApi",
        {
          apiRoute: "swissbix_deal_update_status",
          params: params,
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
  printing_katun_bexio_api_set_invoice: async (params: object) => {
      console.info("dispatcher: printing_katun_bexio_api_set_invoice")
      try {
        const response = await axiosInstanceClient.post(
          "/postApi",
        {
          apiRoute: "printing_katun_bexio_api_set_invoice",
          params: params,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )
      toast.success("Fattura caricata in bexio: " + response.data.status)
      console.info("dispatcher: printing_katun_bexio_api_set_invoice response", response.data)
      return response.data
    } catch (error) {
      console.error("Errore durante la creazione dei record", error)
      toast.error("Errore durante la creazione dei record")
    }
  },
  
  //TODO
  //CUSTOM PITSERVICE
  // offertaChiusaVinta: async ({ recordid }: { recordid: string }) => {
  //   try {
  //           const response = await axiosInstanceClient.post(
  //               "/postApi",
  //               {
  //                   apiRoute: "pitservice_offerta_chiusa_vinta",
  //                   tableid: tableid,
  //                   recordid: recordid,
  //               },
  //               {
  //                   headers: {
  //                       Authorization: `Bearer ${localStorage.getItem("token")}`,
  //                   },
  //               }
  //           )
  //           handleRemoveCard();
  //           toast.success('Offerta chiusa vinta');
  //       } catch (error) {
  //       console.error('Errore durante la chiusura dell offerta', error);
  //       toast.error('Errore durante la chiusura dell offerta');
  //   }
  // },
  // offertaChiusaPersa: async ({ recordid }: { recordid: string }) => {
  //   try {
  //           const response = await axiosInstanceClient.post(
  //               "/postApi",
  //               {
  //                   apiRoute: "pitservice_offerta_chiusa_persa",
  //                   tableid: tableid,
  //                   recordid: recordid,
  //               },
  //               {
  //                   headers: {
  //                       Authorization: `Bearer ${localStorage.getItem("token")}`,
  //                   },
  //               }
  //           )
  //           handleRemoveCard();
  //           toast.success('Offerta chiusa persa');
  //       } catch (error) {
  //       console.error('Errore durante la chiusura persa dell offerta', error);
  //       toast.error('Errore durante la chiusura persa dell offerta');
  //   }
  // }
  // const handleRemoveCard = () => {
  //   setAnimationClass('animate-slide-out');
  //   setTimeout(() => {
  //       removeCard(tableid, recordid);
  //   }, 300);
  // };

  // ----------------------- Belotti functions ------------------------
  confermaMerceRicevuta: async ({ recordid }: { recordid: string }) => {
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "belotti_conferma_ricezione",
          recordid: recordid,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Stato della merce aggiornato a 'Merce Ricevuta'.");
      }
    } catch (error) {
      toast.error("Errore durante la conferma della merce ricevuta");
    }
  },
  
  fieldsupdate: async (params: object) => {
      console.info("dispatcher: printing_katun_bexio_api_set_invoice")
      try {
        const response = await axiosInstanceClient.post(
          "/postApi",
        {
          apiRoute: "fieldsupdate",
          params: params,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )
      toast.success("Aggiornato")
      setRefreshTable((v) => v + 1)
      return response.data
    } catch (error) {
      console.error("Errore durante il salvataggio", error)
      toast.error("Errore durante il salvataggio")
    }
  },

  openNewRecordCard: ({tableid} : {tableid: string}) => {
    handleRowClick('linked', '', tableid)
  },

  printDeal: async ({ recordid }: { recordid: string }) => {
     try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "print_deal",
          recordid: recordid,
        },
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const contentDisposition = response.headers['content-disposition'] || '';
      let filename = 'pdftest.pdf';

      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      toast.success('PDF stampato con successo');

    } catch (error) {
      console.error('Errore durante la stampa del PDF', error);
      toast.error('Errore durante la stampa del PDF');
    }
  },

  printServiceContract: async ({ recordid }: { recordid: string }) => {
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "print_servicecontract",
          recordid: recordid,
        },
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const contentDisposition = response.headers['content-disposition'] || '';
      let filename = 'pdftest.pdf';

      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      toast.success('PDF stampato con successo');

    } catch (error) {
      console.error('Errore durante la stampa del PDF', error);
      toast.error('Errore durante la stampa del PDF');
    }
  },

  renewServiceContract: async ({ recordid }: { recordid: string }) => {
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "renew_servicecontract",
          recordid: recordid,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

    } catch (error) {
      console.error('Errore durante il rinnovo del contratto', error);
      toast.error('Errore durante il rinnovo del contratto');
    }
  },
}
}