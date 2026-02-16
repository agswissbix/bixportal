
"use client"

import { useState } from "react"
import {
  ArrowLeft,
  User,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  Banknote,
  StickyNote,
  Hash,
  Building,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PdfPreview } from "./PdfPreview"
import type { Invoice, Supplier } from "./mock-data"


interface InvoiceDetailProps {
  invoice: Invoice
  supplier: Supplier
  onBack: () => void
  onConfirm: () => void
  onReject: () => void
}

export function InvoiceDetail({
  invoice,
  supplier,
  onBack,
  onConfirm,
  onReject,
}: InvoiceDetailProps) {
  const [importo, setImporto] = useState(invoice.importo.toFixed(2))
  const [importoDaPagare, setImportoDaPagare] = useState(invoice.importoDaPagare.toFixed(2))
  const [dataPagamento, setDataPagamento] = useState(invoice.dataPagamento)
  const [note, setNote] = useState(invoice.note)

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla lista fatture
        </button>

        <div className="flex items-center gap-2">
          <Button
            onClick={onReject}
            variant="destructive"
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Rifiuta pagamento
          </Button>
          <Button
            onClick={onConfirm}
            size="sm"
            className="bg-green-600 text-white hover:bg-green-700"
          >
            Conferma pagamento
          </Button>
        </div>
      </div>

      {/* Main content: PDF left, metadata right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">
        {/* PDF Preview */}
        <div className="lg:col-span-3 min-h-[500px] lg:min-h-0">
          <PdfPreview invoice={invoice} supplier={supplier} />
        </div>

        {/* Metadata panel */}
        <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white overflow-auto shadow-sm">
          <div className="px-5 py-3.5 text-slate-50 bg-slate-700 border-b border-slate-200">
            <h3 className="text-sm font-semibold">Indici &quot;Fatture&quot;</h3>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Nome fornitore */}
            <div className="flex items-start gap-3">
              <Building className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <Label className="text-xs text-slate-500">Nome fornitore</Label>
                <p className="text-sm font-medium text-slate-900">{supplier.nome}</p>
              </div>
            </div>

            {/* Nr fattura */}
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <Label className="text-xs text-slate-500">Nr. fattura</Label>
                <p className="text-sm font-medium text-slate-900">{invoice.nrFattura}</p>
              </div>
            </div>

            {/* Responsabile */}
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <Label className="text-xs text-slate-500">Responsabile</Label>
                <p className="text-sm font-medium text-slate-900">{invoice.responsabile}</p>
              </div>
            </div>

            {/* Data documento */}
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <Label className="text-xs text-slate-500">Data documento</Label>
                <p className="text-sm font-medium text-slate-900">{invoice.dataDocumento}</p>
              </div>
            </div>

            {/* Scadenza */}
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <Label className="text-xs text-slate-500">Scadenza</Label>
                <p className="text-sm font-medium text-slate-900">{invoice.scadenza}</p>
              </div>
            </div>

            {/* Importo - editable */}
            <div className="flex items-start gap-3">
              <CreditCard className="h-4 w-4 text-slate-400 mt-2 shrink-0" />
              <div className="flex-1">
                <Label htmlFor="importo" className="text-xs text-slate-500">
                  Importo
                </Label>
                <Input
                  id="importo"
                  value={importo}
                  onChange={(e) => setImporto(e.target.value)}
                  className="mt-1 h-8 text-sm bg-white border-slate-300"
                />
              </div>
            </div>

            {/* Note di credito */}
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <Label className="text-xs text-slate-500">Note di credito</Label>
                <p className="text-sm text-slate-900">{invoice.noteDiCredito || "-"}</p>
              </div>
            </div>

            {/* Totale netto */}
            <div className="flex items-start gap-3">
              <Banknote className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <Label className="text-xs text-slate-500">Totale netto</Label>
                <p className="text-sm font-medium text-slate-900">
                  {invoice.totaleNetto.toLocaleString("it-CH", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Data pagamento - editable */}
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-slate-400 mt-2 shrink-0" />
              <div className="flex-1">
                <Label htmlFor="dataPagamento" className="text-xs text-slate-500">
                  Data pagamento
                </Label>
                <Input
                  id="dataPagamento"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  className="mt-1 h-8 text-sm bg-white border-slate-300"
                />
              </div>
            </div>

            {/* Importo da pagare - editable */}
            <div className="flex items-start gap-3">
              <CreditCard className="h-4 w-4 text-slate-400 mt-2 shrink-0" />
              <div className="flex-1">
                <Label htmlFor="importoDaPagare" className="text-xs text-slate-500">
                  Importo da pagare
                </Label>
                <Input
                  id="importoDaPagare"
                  value={importoDaPagare}
                  onChange={(e) => setImportoDaPagare(e.target.value)}
                  className="mt-1 h-8 text-sm bg-white border-slate-300"
                />
              </div>
            </div>

            {/* Valuta */}
            <div className="flex items-start gap-3">
              <Banknote className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <Label className="text-xs text-slate-500">Valuta</Label>
                <p className="text-sm font-medium text-slate-900">{invoice.valuta}</p>
              </div>
            </div>

            {/* Note - editable */}
            <div className="flex items-start gap-3">
              <StickyNote className="h-4 w-4 text-slate-400 mt-2 shrink-0" />
              <div className="flex-1">
                <Label htmlFor="note" className="text-xs text-slate-500">
                  Note
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-1 text-sm bg-white border-slate-300 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
