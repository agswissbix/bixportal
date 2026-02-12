
"use client"


import { FileText } from "lucide-react"
import { FolderIcon } from "./FolderIcon"
import type { Supplier } from "./mock-data"


interface SupplierGridProps {
  suppliers: Supplier[]
  openSupplierId: string | null
  onToggleSupplier: (supplierId: string) => void
}

export function SupplierGrid({ suppliers, openSupplierId, onToggleSupplier }: SupplierGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {suppliers.map((supplier) => {
        const isOpen = openSupplierId === supplier.id
        const totalAmount = supplier.fatture.reduce((sum, f) => sum + f.importo, 0)
        const currencies = [...new Set(supplier.fatture.map((f) => f.valuta))]

        return (
          <button
            key={supplier.id}
            onClick={() => onToggleSupplier(supplier.id)}
            className={`group flex flex-col items-center gap-2 rounded-lg p-4 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isOpen
                ? "bg-blue-50 ring-2 ring-blue-200 shadow-lg scale-[1.03]"
                : "hover:bg-slate-100 hover:shadow-md hover:scale-[1.02]"
            }`}
          >
            {/* Folder SVG */}
            <div className="relative w-20 h-16 sm:w-24 sm:h-20">
              <FolderIcon
                isOpen={isOpen}
                className="w-full h-full"
                documentCount={supplier.fatture.length}
              />
              {/* Invoice count badge */}
              <div className="absolute -top-1.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-sm">
                {supplier.fatture.length}
              </div>
            </div>

            {/* Supplier name */}
            <div className="flex flex-col items-center gap-0.5 min-w-0 w-full">
              <h3 className="text-xs font-semibold text-slate-900 leading-tight line-clamp-2 text-balance">
                {supplier.nome}
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <FileText className="h-3 w-3 shrink-0" />
                <span>{supplier.fatture.length} fattur{supplier.fatture.length === 1 ? "a" : "e"}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-0.5">
                {currencies.join("/")} {totalAmount.toLocaleString("it-CH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
