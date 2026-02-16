export interface Invoice {
  id: string
  nrFattura: string
  dataDocumento: string
  scadenza: string
  importo: number
  valuta: string
  responsabile: string
  noteDiCredito: string
  totaleNetto: number
  dataPagamento: string
  importoDaPagare: number
  note: string
  pdfFileName: string
}

export interface Supplier {
  id: string
  nome: string
  indirizzo: string
  iban: string
  partitaIva: string
  fatture: Invoice[]
}

export const suppliers: Supplier[] = [
  {
    id: "sup-1",
    nome: "LUXOTTICA AG",
    indirizzo: "Industriestrasse 17, 4632 Trimbach, Switzerland",
    iban: "CH9489950000129728 75",
    partitaIva: "CHE-107.486.928 MWST",
    fatture: [
      {
        id: "inv-1",
        nrFattura: "6009019307",
        dataDocumento: "27/12/2025",
        scadenza: "25/02/2026",
        importo: 520.63,
        valuta: "CHF",
        responsabile: "f.lisi (Fabio Lisi)",
        noteDiCredito: "",
        totaleNetto: 520.63,
        dataPagamento: "25/02/2026",
        importoDaPagare: 520.63,
        note: "Fornitura Luxottica Ottica Blitz Tenero scontistiche corrette (vedi commenti)\nTotale da pagare CHF 520.63",
        pdfFileName: "FT0003861.PDF",
      },
      {
        id: "inv-2",
        nrFattura: "6009019450",
        dataDocumento: "03/01/2026",
        scadenza: "04/03/2026",
        importo: 1245.80,
        valuta: "CHF",
        responsabile: "f.lisi (Fabio Lisi)",
        noteDiCredito: "",
        totaleNetto: 1245.80,
        dataPagamento: "04/03/2026",
        importoDaPagare: 1245.80,
        note: "Fornitura lenti e montature Luxottica\nTotale da pagare CHF 1245.80",
        pdfFileName: "FT0003920.PDF",
      },
      {
        id: "inv-3",
        nrFattura: "6009019512",
        dataDocumento: "15/01/2026",
        scadenza: "16/03/2026",
        importo: 378.25,
        valuta: "CHF",
        responsabile: "m.rossi (Marco Rossi)",
        noteDiCredito: "",
        totaleNetto: 378.25,
        dataPagamento: "16/03/2026",
        importoDaPagare: 378.25,
        note: "Ordine mascherine e accessori\nTotale da pagare CHF 378.25",
        pdfFileName: "FT0003945.PDF",
      },
    ],
  },
  {
    id: "sup-2",
    nome: "ESSILOR ITALIA SPA",
    indirizzo: "Via Norberto Rosa 6, 10154 Torino, Italia",
    iban: "IT60X0542811101000000123456",
    partitaIva: "IT01234567890",
    fatture: [
      {
        id: "inv-4",
        nrFattura: "ES2026-00142",
        dataDocumento: "10/01/2026",
        scadenza: "11/03/2026",
        importo: 2890.00,
        valuta: "EUR",
        responsabile: "g.bianchi (Giovanni Bianchi)",
        noteDiCredito: "",
        totaleNetto: 2890.00,
        dataPagamento: "11/03/2026",
        importoDaPagare: 2890.00,
        note: "Fornitura lenti progressive Varilux\nTotale da pagare EUR 2890.00",
        pdfFileName: "FT-ES-00142.PDF",
      },
      {
        id: "inv-5",
        nrFattura: "ES2026-00198",
        dataDocumento: "22/01/2026",
        scadenza: "23/03/2026",
        importo: 765.40,
        valuta: "EUR",
        responsabile: "g.bianchi (Giovanni Bianchi)",
        noteDiCredito: "",
        totaleNetto: 765.40,
        dataPagamento: "23/03/2026",
        importoDaPagare: 765.40,
        note: "Lenti Crizal e trattamenti\nTotale da pagare EUR 765.40",
        pdfFileName: "FT-ES-00198.PDF",
      },
    ],
  },
  {
    id: "sup-3",
    nome: "HOYA LENS SCHWEIZ AG",
    indirizzo: "Bahnhofstrasse 12, 8001 Zurich, Switzerland",
    iban: "CH3908704016075473007",
    partitaIva: "CHE-116.234.567 MWST",
    fatture: [
      {
        id: "inv-6",
        nrFattura: "HY-2026-0034",
        dataDocumento: "05/01/2026",
        scadenza: "06/03/2026",
        importo: 4120.50,
        valuta: "CHF",
        responsabile: "f.lisi (Fabio Lisi)",
        noteDiCredito: "",
        totaleNetto: 4120.50,
        dataPagamento: "06/03/2026",
        importoDaPagare: 4120.50,
        note: "Fornitura lenti Hoyalux iD MyStyle\nTotale da pagare CHF 4120.50",
        pdfFileName: "FT-HY-0034.PDF",
      },
    ],
  },
  {
    id: "sup-4",
    nome: "SAFILO GROUP SPA",
    indirizzo: "Settima Strada 15, 35129 Padova, Italia",
    iban: "IT40L0300203280612345678901",
    partitaIva: "IT03032950242",
    fatture: [
      {
        id: "inv-7",
        nrFattura: "SAF-2026-0891",
        dataDocumento: "12/01/2026",
        scadenza: "13/03/2026",
        importo: 1580.00,
        valuta: "EUR",
        responsabile: "m.rossi (Marco Rossi)",
        noteDiCredito: "",
        totaleNetto: 1580.00,
        dataPagamento: "13/03/2026",
        importoDaPagare: 1580.00,
        note: "Montature Carrera e Jimmy Choo\nTotale da pagare EUR 1580.00",
        pdfFileName: "FT-SAF-0891.PDF",
      },
      {
        id: "inv-8",
        nrFattura: "SAF-2026-0923",
        dataDocumento: "20/01/2026",
        scadenza: "21/03/2026",
        importo: 934.60,
        valuta: "EUR",
        responsabile: "m.rossi (Marco Rossi)",
        noteDiCredito: "",
        totaleNetto: 934.60,
        dataPagamento: "21/03/2026",
        importoDaPagare: 934.60,
        note: "Montature Hugo Boss e Fossil\nTotale da pagare EUR 934.60",
        pdfFileName: "FT-SAF-0923.PDF",
      },
      {
        id: "inv-9",
        nrFattura: "SAF-2026-0967",
        dataDocumento: "28/01/2026",
        scadenza: "29/03/2026",
        importo: 2210.15,
        valuta: "EUR",
        responsabile: "g.bianchi (Giovanni Bianchi)",
        noteDiCredito: "",
        totaleNetto: 2210.15,
        dataPagamento: "29/03/2026",
        importoDaPagare: 2210.15,
        note: "Montature Kate Spade e Pierre Cardin\nTotale da pagare EUR 2210.15",
        pdfFileName: "FT-SAF-0967.PDF",
      },
    ],
  },
  {
    id: "sup-5",
    nome: "ZEISS VISION CARE AG",
    indirizzo: "Carl-Zeiss-Strasse 22, 73447 Oberkochen, Germany",
    iban: "DE89370400440532013000",
    partitaIva: "DE812345678",
    fatture: [
      {
        id: "inv-10",
        nrFattura: "ZV-2026-1102",
        dataDocumento: "08/01/2026",
        scadenza: "09/03/2026",
        importo: 3455.90,
        valuta: "EUR",
        responsabile: "f.lisi (Fabio Lisi)",
        noteDiCredito: "",
        totaleNetto: 3455.90,
        dataPagamento: "09/03/2026",
        importoDaPagare: 3455.90,
        note: "Lenti ZEISS DriveSafe e SmartLife\nTotale da pagare EUR 3455.90",
        pdfFileName: "FT-ZV-1102.PDF",
      },
    ],
  },
]
