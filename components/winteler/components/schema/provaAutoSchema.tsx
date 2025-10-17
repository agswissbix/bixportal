import { GenericFormSchema } from "../generalFormTypes";

export const PROVA_AUTO_SCHEMA: GenericFormSchema = [
    {
        key: 'datiAuto',
        title: 'Dati auto',
        fields: [
            { id: 'barcode', label: 'Barcode', type: 'text', path: 'provaAuto.datiAuto.barcode',
                actionButton: {
                    text: 'Cerca',
                    action: (path) => { console.log(`Cerca dati per: ${path}`); }
                    }
                },
            { id: 'telaio', label: 'Telaio', type: 'text', path: 'provaAuto.datiAuto.telaio',
                actionButton: {
                    text: 'Cerca',
                    action: (path) => { console.log(`Cerca dati per: ${path}`); }
                    }
                }, 
            { id: 'modello', label: 'Modello', type: 'text', path: 'provaAuto.datiAuto.modello' }, 
            { id: 'targa', label: 'Targa', type: 'text', path: 'provaAuto.datiAuto.targa', required: true },
            { id: 'provaFutura', label: 'Prova Futura', type: 'checkbox', path: 'provaAuto.datiAuto.provaFutura' },
        ],
        specialComponent: 'BarcodeScanner',
        specialDataPath: 'provaAuto.datiAuto.barcode', 
    },
    {
        key: 'datiCliente',
        title: 'Dati cliente',
        fields: [
            { id: 'cognome', label: 'Cognome', type: 'text', path: 'provaAuto.datiCliente.cognome', required: true  },
            { id: 'nome', label: 'Nome', type: 'text', path: 'provaAuto.datiCliente.nome', required: true  },
            { id: 'email', label: 'Email', type: 'email', path: 'provaAuto.datiCliente.email' },
            { id: 'indirizzo', label: 'Via / N. Civico', type: 'text', path: 'provaAuto.datiCliente.indirizzo', required: true  },
            { id: 'cap', label: 'CAP', type: 'text', path: 'provaAuto.datiCliente.cap', required: true  },
            { id: 'citta', label: 'Città', type: 'text', path: 'provaAuto.datiCliente.citta', required: true  },
            { id: 'telefono', label: 'Telefono', type: 'text', path: 'provaAuto.datiCliente.telefono', required: true  },
        ],
        specialComponent: 'PhotoUpload',
        specialDataPath: 'provaAuto.datiCliente.fotoPatente',
    },
    {
        key: 'situazionePartenza',
        title: 'Situazione partenza',
        fields: [
            { id: 'kmPartenza', label: 'Km partenza', type: 'number', path: 'provaAuto.situazionePartenza.km' },
            { id: 'dataPartenza', label: 'Data partenza', type: 'date', path: 'provaAuto.situazionePartenza.data', required: true  },
            { id: 'oraPartenza', label: 'Ora partenza', type: 'time', path: 'provaAuto.situazionePartenza.data', required: true  },
        ],
        specialComponent: 'PhotoUpload',
        specialDataPath: 'provaAuto.situazionePartenza.foto',
    },
    {
        key: 'situazioneRientro',
        title: 'Situazione rientro',
        fields: [
            { id: 'kmRientro', label: 'Km arrivo', type: 'number', path: 'provaAuto.situazioneRientro.km' },
            { id: 'dataRientro', label: 'Data arrivo', type: 'date', path: 'provaAuto.situazioneRientro.data' },
            { id: 'oraRientro', label: 'Ora arrivo', type: 'time', path: 'provaAuto.situazioneRientro.data' },
        ],
        specialComponent: 'PhotoUpload',
        specialDataPath: 'provaAuto.situazioneRientro.foto',
    },
    {
        key: 'condizioniNoleggio',
        title: 'Condizioni di noleggio',
        fields: [],
        specialComponent: 'CustomHtmlBlock',
    },
];