"use client"

import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Invoice, Supplier } from "./mock-data"

interface PdfPreviewProps {
  invoice: Invoice
  supplier: Supplier
}

export function PdfPreview({ invoice, supplier }: PdfPreviewProps) {
  return (
    <div className="flex flex-col h-full rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* PDF header bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 text-slate-50 bg-slate-700 border-b border-slate-200">
        <FileText className="h-4 w-4" />
        <span className="text-sm font-medium">
          Anteprima &quot;{invoice.pdfFileName}&quot;
        </span>
      </div>

      {/* PDF mock content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-100/50">
        <div className="mx-auto max-w-2xl rounded border border-slate-200 bg-white p-8 shadow-sm">
          {/* Invoice header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex flex-col gap-1">
              <div className="text-lg font-bold text-slate-900">{supplier.nome}</div>
              <div className="text-xs text-slate-500">{supplier.indirizzo}</div>
              <div className="text-xs text-slate-500">IVA: {supplier.partitaIva}</div>
              <div className="text-xs text-slate-500">IBAN: {supplier.iban}</div>
            </div>
            <div className="text-right flex flex-col gap-1">
              <div className="text-xs text-slate-500">Intestata a: 1030664</div>
              <div className="text-sm font-medium text-slate-900">Ottica Belotti SA, Castione</div>
              <div className="text-xs text-slate-500">Via Retica 2</div>
              <div className="text-xs text-slate-500">6532 - Castione</div>
              <div className="text-xs text-slate-500">Svizzera</div>
            </div>
          </div>

          {/* Invoice number & date */}
          <div className="flex gap-8 mb-6">
            <div>
              <span className="text-xs text-slate-500">Fattura Nr.</span>
              <div className="text-sm font-semibold text-slate-900">Z1CN {invoice.nrFattura}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500">Data Fattura</span>
              <div className="text-sm font-semibold text-slate-900">{invoice.dataDocumento}</div>
            </div>
          </div>

          {/* Barcode placeholder */}
          <div className="flex items-center justify-center h-12 bg-slate-100 rounded mb-6 overflow-hidden">
            <div className="flex gap-[2px] opacity-80">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-900"
                  style={{
                    width: Math.random() > 0.5 ? 2 : 1,
                    height: 28 + Math.random() * 8,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Payment info */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
            <div>
              <span className="text-slate-500">Cond. di Pag.</span>
              <div className="text-slate-900 font-medium">60 GG FINE MESE</div>
            </div>
            <div>
              <span className="text-slate-500">Metodo di pagamento</span>
              <div className="text-slate-900 font-medium">Bonifico Bancario</div>
            </div>
          </div>

          {/* Line items table */}
          <div className="border border-slate-200 rounded overflow-hidden mb-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="px-3 py-2 text-left font-semibold">Descrizione</th>
                  <th className="px-3 py-2 text-center font-semibold">{'Qt\u00e0'}</th>
                  <th className="px-3 py-2 text-right font-semibold">Prezzo Unit.</th>
                  <th className="px-3 py-2 text-right font-semibold">Sconto</th>
                  <th className="px-3 py-2 text-right font-semibold">Importo</th>
                  <th className="px-3 py-2 text-center font-semibold">Valuta</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="px-3 py-2 text-slate-700">OCCHIALE CON COMPONENTE ELETTRONICA</td>
                  <td className="px-3 py-2 text-center text-slate-700">1</td>
                  <td className="px-3 py-2 text-right text-slate-700">366.19</td>
                  <td className="px-3 py-2 text-right text-slate-400">-</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900">366.19</td>
                  <td className="px-3 py-2 text-center text-slate-700">{invoice.valuta}</td>
                </tr>
                <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="px-3 py-2 text-slate-700">OCCHIALE INIETTATO DONNA VISTA</td>
                  <td className="px-3 py-2 text-center text-slate-700">1</td>
                  <td className="px-3 py-2 text-right text-slate-700">73.69</td>
                  <td className="px-3 py-2 text-right text-slate-400">20.00%</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900">58.95</td>
                  <td className="px-3 py-2 text-center text-slate-700">{invoice.valuta}</td>
                </tr>
                <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="px-3 py-2 text-slate-700">LENTI</td>
                  <td className="px-3 py-2 text-center text-slate-700">2</td>
                  <td className="px-3 py-2 text-right text-slate-700">12.34</td>
                  <td className="px-3 py-2 text-right text-slate-400">20.00%</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900">19.74</td>
                  <td className="px-3 py-2 text-center text-slate-700">{invoice.valuta}</td>
                </tr>
                <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="px-3 py-2 text-slate-700">MASCHERINE</td>
                  <td className="px-3 py-2 text-center text-slate-700">1</td>
                  <td className="px-3 py-2 text-right text-slate-700">45.93</td>
                  <td className="px-3 py-2 text-right text-slate-400">20.00%</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900">36.74</td>
                  <td className="px-3 py-2 text-center text-slate-700">{invoice.valuta}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-56 flex flex-col gap-1 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotale</span>
                <span className="text-slate-900">{invoice.valuta} {invoice.importo.toLocaleString("it-CH", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>IVA (0%)</span>
                <span className="text-slate-900">{invoice.valuta} 0.00</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 pt-2 mt-1 text-slate-900">
                <span>Totale</span>
                <span>{invoice.valuta} {invoice.importo.toLocaleString("it-CH", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
