
"use client"

import { useEffect, useState } from "react"
import {
  Calendar,
  FileText,
  CreditCard,
  Eye,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Supplier, Invoice } from "./mock-data"


interface InvoiceCardsProps {
  supplier: Supplier
  onSelectInvoice: (invoice: Invoice) => void
  onConfirmGroup: () => void
  onRejectGroup: () => void
  onClose: () => void
}

export function InvoiceCards({
  supplier,
  onSelectInvoice,
  onConfirmGroup,
  onRejectGroup,
  onClose,
}: InvoiceCardsProps) {
  const totalAmount = supplier.fatture.reduce((sum, f) => sum + f.importo, 0)
  const currencies = [...new Set(supplier.fatture.map((f) => f.valuta))]
  const currencyLabel = currencies.join(" / ")

  const [groupPaymentDate, setGroupPaymentDate] = useState(
    supplier.fatture[0]?.dataPagamento ?? ""
  )
  const [groupTotal, setGroupTotal] = useState(totalAmount.toFixed(2))

  useEffect(() => {
    setGroupTotal(totalAmount.toFixed(2))
    setGroupPaymentDate(supplier.fatture[0]?.dataPagamento ?? "")
  }, [supplier])

  return (
    <div className="flex flex-col gap-4 animate-slide-up-fade">
      {/* Group header bar */}
      <div className="flex flex-col gap-4 rounded-lg border border-blue-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-base font-bold text-slate-800">{supplier.nome}</h3>
            <p className="text-xs text-slate-500">{supplier.indirizzo}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Chiudi</span>
          </Button>
        </div>

        {/* Group payment controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <Label htmlFor="grp-total" className="text-xs text-slate-500">
              Importo totale ({currencyLabel})
            </Label>
            <Input
              id="grp-total"
              value={groupTotal}
              onChange={(e) => setGroupTotal(e.target.value)}
              className="h-9 bg-white text-sm border-slate-300"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="grp-date" className="text-xs text-slate-500">
              Data pagamento
            </Label>
            <Input
              id="grp-date"
              value={groupPaymentDate}
              onChange={(e) => setGroupPaymentDate(e.target.value)}
              placeholder="GG/MM/AAAA"
              className="h-9 bg-white text-sm border-slate-300"
            />
          </div>
          <Button
            onClick={onConfirmGroup}
            className="h-9 bg-green-600 text-white hover:bg-green-500 text-sm"
          >
            Conferma pagamento
          </Button>
          <Button onClick={onRejectGroup} variant="destructive" className="h-9 text-sm bg-red-600 hover:bg-red-700 text-white">
            Rifiuta pagamento
          </Button>
        </div>
      </div>

      {/* Invoice cards - burst animation with staggered delays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {supplier.fatture.map((invoice, index) => (
          <InvoiceCard
            key={invoice.id}
            invoice={invoice}
            index={index}
            onSelect={() => onSelectInvoice(invoice)}
          />
        ))}
      </div>
    </div>
  )
}

function InvoiceCard({
  invoice,
  index,
  onSelect,
}: {
  invoice: Invoice
  index: number
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className="group flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left opacity-0 animate-invoice-burst transition-shadow hover:shadow-md hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Top: PDF icon + number */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-50">
            <FileText className="h-4.5 w-4.5 text-red-500" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-slate-800 truncate">
              {invoice.pdfFileName}
            </span>
            <span className="text-[11px] text-slate-500">
              Nr. {invoice.nrFattura}
            </span>
          </div>
        </div>
        <Eye className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
      </div>

      {/* Invoice details */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="h-3 w-3" />
            <span>{invoice.dataDocumento}</span>
          </div>
          <span className="text-slate-500">Scad. {invoice.scadenza}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CreditCard className="h-3 w-3" />
            <span>{invoice.responsabile.split("(")[0].trim()}</span>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
            {invoice.valuta}
          </span>
        </div>
      </div>

      {/* Amount - prominent */}
      <div className="flex items-baseline justify-end gap-1 border-t border-slate-100 pt-2.5">
        <span className="text-lg font-bold text-slate-900">
          {invoice.importo.toLocaleString("it-CH", { minimumFractionDigits: 2 })}
        </span>
        <span className="text-xs text-slate-500">{invoice.valuta}</span>
      </div>
    </button>
  )
}
