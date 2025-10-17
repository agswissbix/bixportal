import { GenericFormSchema } from "../generalFormTypes";

export const CHECK_LIST_SCHEMA: GenericFormSchema = [
    {
        key: 'datiCliente',
        title: 'Dati cliente',
        fields: [
            { 
                id: 'divider-anagrafica', 
                label: 'Dati Anagrafici', 
                type: 'divider', 
                path: 'dummy.path',
                className: 'w-full px-2'
            },
            { id: 'nome', label: 'Nome detentore', type: 'text', path: 'checkList.datiCliente.nome'},
            { id: 'indirizzo', label: 'Indirizzo', type: 'text', path: 'checkList.datiCliente.indirizzo'},
            
            { 
                id: 'divider-contatti', 
                label: 'Contatti e Riferimenti', 
                type: 'divider', 
                path: 'dummy.path',
                className: 'w-full px-2'
            },
            { id: 'telefono', label: 'Telefono', type: 'text', path: 'checkList.datiCliente.telefono'}, 
            { id: 'email', label: 'Email', type: 'email', path: 'checkList.datiCliente.email'}, 

            { 
                id: 'venditore', 
                label: 'Venditore', 
                type: 'select', 
                path: 'checkList.datiCliente.venditore',
            },
        ],
    },
    {
        key: 'datiVettura',
        title: 'Dati vettura',
        fields: [
            { id: 'marca', label: 'Marca', type: 'text', path: 'checkList.datiVettura.marca'},
            { id: 'modello', label: 'Modello', type: 'text', path: 'checkList.datiVettura.modello'},
            { id: 'telaio', label: 'Telaio', type: 'text', path: 'checkList.datiVettura.telaio'},
            { id: 'targa', label: 'Targa', type: 'text', path: 'checkList.datiVettura.targa'},
            { id: 'km', label: 'Km', type: 'number', path: 'checkList.datiVettura.km'},
        ],
    },
    {
        key: 'controlloOfficina',
        title: 'Controllo officina',
        fields: [
            { 
                id: 'divider-pneumatici', 
                label: 'Pneumatici', 
                type: 'divider', 
                path: ' ',
                className: 'w-full px-2'
            },

            { id: 'pnAntSxTitle', label: 'ANT SX', type: 'label-only', path: ' ', className: 'w-1/2' }, 
            { id: 'pnAntDxTitle', label: 'ANT DX', type: 'label-only', path: ' ', className: 'w-1/2' },
            
            { id: 'antSxMm', label: 'mm', type: 'number', path: 'checkList.controlloOfficina.pneumatici.antSx.mm', className: 'w-1/2 px-2'}, 
            { id: 'antDxMm', label: 'mm', type: 'number', path: 'checkList.controlloOfficina.pneumatici.antDx.mm', className: 'w-1/2 px-2'}, 
            
            { id: 'antSxData', label: 'Data', type: 'date', path: 'checkList.controlloOfficina.pneumatici.antSx.data', className: 'w-1/2 px-2 mt-8'}, 
            { id: 'antDxData', label: 'Data', type: 'date', path: 'checkList.controlloOfficina.pneumatici.antDx.data', className: 'w-1/2 px-2 mt-8'}, 

            { id: 'pnPostSxTitle', label: 'POST SX', type: 'label-only', path: ' ', className: 'w-1/2 mt-8' }, 
            { id: 'pnPostDxTitle', label: 'POST DX', type: 'label-only', path: ' ', className: 'w-1/2 mt-8' },

            { id: 'postSxMm', label: 'mm', type: 'number', path: 'checkList.controlloOfficina.pneumatici.postSx.mm', className: 'w-1/2 px-2'}, 
            { id: 'postDxMm', label: 'mm', type: 'number', path: 'checkList.controlloOfficina.pneumatici.postDx.mm', className: 'w-1/2 px-2'}, 
            
            { id: 'postSxData', label: 'Data', type: 'date', path: 'checkList.controlloOfficina.pneumatici.postSx.data', className: 'w-1/2 px-2 mt-8'}, 
            { id: 'postDxData', label: 'Data', type: 'date', path: 'checkList.controlloOfficina.pneumatici.postDx.data', className: 'w-1/2 px-2 mt-8'}, 
        
            { id: 'cerchiDivider', label: 'Cerchi', type: 'divider', path: ' ' }, 
            
            { 
                id: 'antSxCerchi', 
                label: 'ANT SX', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.cerchi.antSx', 
                options: [{ value: 'ok', label: 'Ok' }, { value: 'non ok', label: 'Non Ok' }],
                className: 'w-1/2',
            },
            { 
                id: 'antDxCerchi', 
                label: 'ANT DX', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.cerchi.antDx', 
                options: [{ value: 'ok', label: 'Ok' }, { value: 'non ok', label: 'Non Ok' }],
                className: 'w-1/2',
            },
            { 
                id: 'postSxCerchi', 
                label: 'POST SX', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.cerchi.postSx', 
                options: [{ value: 'ok', label: 'Ok' }, { value: 'non ok', label: 'Non Ok' }],
                className: 'w-1/2 mt-8',
            },
            { 
                id: 'postDxCerchi', 
                label: 'POST DX', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.cerchi.postDx', 
                options: [{ value: 'ok', label: 'Ok' }, { value: 'non ok', label: 'Non Ok' }],
                className: 'w-1/2 mt-8',
            },

            // Freni
            { id: 'freniDivider', label: 'Freni', type: 'divider', path: ' ' }, 
            

            { id: 'antSxTitle', label: 'ANT SX', type: 'label-only', path: ' ', className: 'w-1/2' }, 
            { id: 'antDxTitle', label: 'ANT DX', type: 'label-only', path: ' ', className: 'w-1/2' },

            { id: 'antSxFreniPercent', label: '%', type: 'number', path: 'checkList.controlloOfficina.freni.antSx.perc', className: 'w-1/2 pr-8 pl-8' },
            { id: 'antDxFreniPercent', label: '%', type: 'number', path: 'checkList.controlloOfficina.freni.antDx.perc', className: 'w-1/2 pr-8 pl-8' },

            { 
                id: 'antSxFreniStato', 
                label: ' ', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.freni.antSx.stato', 
                options: [{ value: 'ok', label: 'Ok' }, { value: 'sost', label: 'Sost' }],
                className: 'w-1/2',
            },
            { 
                id: 'antDxFreniStato', 
                label: ' ', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.freni.antDx.stato', 
                options: [{ value: 'ok', label: 'Ok' }, { value: 'sost', label: 'Sost' }],
                className: 'w-1/2',
            },

            { id: 'postSxTitle', label: 'POST SX', type: 'label-only', path: ' ', className: 'w-1/2 mt-4' }, 
            { id: 'postDxTitle', label: 'POST DX', type: 'label-only', path: ' ', className: 'w-1/2 mt-4' },

            { id: 'postSxFreniPercent', label: '%', type: 'number', path: 'checkList.controlloOfficina.freni.postSx.perc', className: 'w-1/2 pr-8 pl-8' },
            { id: 'postDxFreniPercent', label: '%', type: 'number', path: 'checkList.controlloOfficina.freni.postDx.perc', className: 'w-1/2 pr-8 pl-8' },

            { 
                id: 'postSxFreniStato', 
                label: ' ', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.freni.postSx.stato', 
                options: [{ value: 'ok', label: 'Ok' }, { value: 'sost', label: 'Sost' }],
                className: 'w-1/2',
            },
            { 
                id: 'postDxFreniStato', 
                label: ' ', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.freni.postDx.stato', 
                options: [{ value: 'ok', label: 'Ok' }, { value: 'sost', label: 'Sost' }],
                className: 'w-1/2',
            },

            // Motore
            { id: 'motoreDivider', label: 'Motore / Cambio', type: 'divider', path: ' ' }, 
            

            { id: 'olioTitle', label: 'PERDITE OLIO', type: 'label-only', path: ' ', className: 'w-1/2' }, 
            { id: 'liquidoTitle', label: 'PERDITE LIQUIDO', type: 'label-only', path: ' ', className: 'w-1/2' },

            { 
                id: 'perditeOlio', 
                label: ' ', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.motore.olio.perdite', 
                options: [{ value: 'si', label: 'Si' }, { value: 'no', label: 'No' }],
                className: 'w-1/2',
            },
            { 
                id: 'perditeLiquido', 
                label: ' ', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.motore.liquido.perdite', 
                options: [{ value: 'si', label: 'Si' }, { value: 'no', label: 'No' }],
                className: 'w-1/2',
            },

            { id: 'olioDove', label: 'Dove', type: 'text', path: 'checkList.controlloOfficina.motore.olio.dove', className: 'w-1/2 pr-8 pl-8' },
            { id: 'liquidoDove', label: 'Dove', type: 'text', path: 'checkList.controlloOfficina.motore.liquido.dove', className: 'w-1/2 pr-8 pl-8' },

            //Assale 
            { id: 'assaleDivider', label: 'Assale', type: 'divider', path: ' ' }, 
            

            { id: 'antTitle', label: 'ANTERIORE', type: 'label-only', path: ' ', className: 'w-1/2' }, 
            { id: 'posTitle', label: 'POSTERIORE', type: 'label-only', path: ' ', className: 'w-1/2' },

            { 
                id: 'assaleAnt', 
                label: ' ', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.assale.anteriore.presente', 
                options: [{ value: 'si', label: 'Si' }, { value: 'no', label: 'No' }],
                className: 'w-1/2',
            },
            { 
                id: 'assalePos', 
                label: ' ', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.assale.posteriore.presente', 
                options: [{ value: 'si', label: 'Si' }, { value: 'no', label: 'No' }],
                className: 'w-1/2',
            },

            { id: 'assaleAntDove', label: 'Dove', type: 'text', path: 'checkList.controlloOfficina.assale.anteriore.dove', className: 'w-1/2 pr-8 pl-8' },
            { id: 'assalePosDove', label: 'Dove', type: 'text', path: 'checkList.controlloOfficina.assale.posteriore.dove', className: 'w-1/2 pr-8 pl-8' },

            // Parabrezza
            { id: 'parabrezzaDivider', label: 'Parabrezza', type: 'divider', path: ' ' },
            
            { 
                id: 'parabrezzaDanni', 
                label: 'DANNI', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.parabrezza.danni', 
                options: [{ value: 'si', label: 'Si' }, { value: 'no', label: 'No' }],
                className: 'w-1/2',
            },
            { 
                id: 'parabrezzaSostituzione', 
                label: 'SOSTITUZIONE', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.parabrezza.sostituzione', 
                options: [{ value: 'si', label: 'Si' }, { value: 'no', label: 'No' }],
                className: 'w-1/2',
            },

            // Batteria
            { id: 'batteriaDivider', label: 'Batteria', type: 'divider', path: ' ' },
            
            { 
                id: 'batteriaDanni', 
                label: 'AVVIAMENTO', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.batteria.avviamento', 
                options: [{ value: 'ok', label: 'Ok' }, { value: 'sost', label: 'Sost' }],
                className: 'w-1/2',
            },
            { 
                id: 'batteriaSostituzione', 
                label: 'SECONDARIA', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.batteria.secondaria', 
                options: [{ value: 'ok', label: 'Ok' }, { value: 'sost', label: 'Sost' }],
                className: 'w-1/2',
            },

            // Test Breve
            { id: 'testBreveDivider', label: 'Test Breve', type: 'divider', path: ' ' },
            
            { 
                id: 'testBreve', 
                label: ' ', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.testBreve', 
                options: [{ value: 'si', label: 'Si' }, { value: 'no', label: 'No' }],
                className: "w-full flex items-center"
            },

            // MSI Plus
            { id: 'msiPlusDivider', label: 'MSI Plus', type: 'divider', path: ' ' },
            
            { 
                id: 'msiPlus', 
                label: ' ', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.msiPlus.presente', 
                options: [{ value: 'si', label: 'Si' }, { value: 'no', label: 'No' }],
                className: "w-full flex items-center"
            },

            { id: 'msiPlusScadenza', label: 'Scadenza', type: 'date', path: 'checkList.controlloOfficina.msiPlus.scadenza'}, 

            // Starclass
            { id: 'starclassDivider', label: 'Starclass', type: 'divider', path: ' ' },
            
            { 
                id: 'starclass', 
                label: ' ', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.starclass.presente', 
                options: [{ value: 'si', label: 'Si' }, { value: 'no', label: 'No' }],
                className: "w-full flex items-center"
            },

            { id: 'starclassScadenza', label: 'Scadenza', type: 'date', path: 'checkList.controlloOfficina.starclass.scadenza'}, 

            // Osservazioni
            { id: 'osservazioniDivider', label: 'Osservazioni', type: 'divider', path: ' ' },
            { id: 'osservazioni', label: ' ', type: 'text', path: 'checkList.controlloOfficina.osservazioni', className: "w-full"},
            
            // Stima Costi
            { id: 'stimaCostiDivider', label: 'Stima Costi', type: 'divider', path: ' ' },
            { id: 'stimaCosti', label: ' ', type: 'text', path: 'checkList.controlloOfficina.stimaCosti', className: "w-full"},
        ],
    },
    {
        key: 'controlloCarrozzeria',
        title: 'Controllo Carrozzeria',
        fields: [
            { id: 'grandinataDivider', label: 'Grandinata', type: 'divider', path: ' ' },
            
            { 
                id: 'grandinata', 
                label: ' ', 
                type: 'radio', 
                path: 'checkList.controlloOfficina.controlloCarrozzeria.grandinata', 
                options: [{ value: 'si', label: 'Si' }, { value: 'no', label: 'No' }],
                className: "w-full flex items-center"
            },

            { id: 'osservazioniCarrozzeriaDivider', label: 'Osservazioni', type: 'divider', path: ' ' },
            { id: 'osservazioniCarrozzeria', label: ' ', type: 'text', path: 'checkList.controlloOfficina.controlloCarrozzeria.osservazioni', className: "w-full"},
            
            { id: 'stimaCostiCarrozzeriaDivider', label: 'Stima Costi', type: 'divider', path: ' ' },
            { id: 'stimaCostiCarrozzeria', label: ' ', type: 'text', path: 'checkList.controlloOfficina.controlloCarrozzeria.stimaCosti', className: "w-full"},
        ],
    },
    {
        key: 'caricaFoto',
        title: 'Foto',
        fields: [
        ],
        specialComponent: 'PhotoUpload',
        specialDataPath: 'checkList.foto',
    },
];