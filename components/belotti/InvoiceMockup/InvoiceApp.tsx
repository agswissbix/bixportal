
"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  Home,
  ChevronRight,
  FileText,
  Search,
} from "lucide-react"
import { suppliers } from "./mock-data"
import type { Supplier, Invoice } from "./mock-data"
import { SupplierGrid } from "./SupplierGrid"
import { InvoiceCards } from "./InvoiceCards"
import { InvoiceDetail } from "./InvoiceDetailNew"
import { Input } from "@/components/ui/input"
import { Toaster, toast } from "sonner"



export function InvoiceApp() {
  const [openSupplierId, setOpenSupplierId] = useState<string | null>(null)
  
  // Custom styles for animations to avoid tailwind.config changes
  const animationStyles = `
    @keyframes invoice-burst {
      0% { transform: scale(0.8); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes slide-up-fade {
      0% { transform: translateY(10px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    .animate-invoice-burst {
      animation: invoice-burst 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-slide-up-fade {
      animation: slide-up-fade 0.4s ease-out forwards;
    }
  `
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const invoicesPanelRef = useRef<HTMLDivElement>(null)

  const openSupplier = openSupplierId
    ? suppliers.find((s) => s.id === openSupplierId) ?? null
    : null

  const handleToggleSupplier = useCallback((supplierId: string) => {
    setOpenSupplierId((prev) => (prev === supplierId ? null : supplierId))
    setSelectedInvoice(null)
    setSelectedSupplier(null)
  }, [])

  const handleSelectInvoice = useCallback(
    (invoice: Invoice) => {
      setSelectedInvoice(invoice)
      setSelectedSupplier(openSupplier)
    },
    [openSupplier]
  )

  const handleBackFromDetail = useCallback(() => {
    setSelectedInvoice(null)
    setSelectedSupplier(null)
  }, [])

  const handleBackToSuppliers = useCallback(() => {
    setOpenSupplierId(null)
    setSelectedInvoice(null)
    setSelectedSupplier(null)
  }, [])

  const handleConfirm = useCallback(() => {
    toast.success("Pagamento confermato con successo")
  }, [])

  const handleReject = useCallback(() => {
    toast.error("Pagamento rifiutato")
  }, [])

  // Scroll to invoices panel when a folder opens
  useEffect(() => {
    if (openSupplierId && invoicesPanelRef.current) {
      setTimeout(() => {
        invoicesPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
  }, [openSupplierId])

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.indirizzo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // If viewing a single invoice detail
  if (selectedInvoice && selectedSupplier) {
    return (
      <div className="flex flex-col h-screen bg-slate-50">
        <style>{animationStyles}</style>
        <Toaster position="top-right" richColors />
        <Header>
          <button
            onClick={handleBackToSuppliers}
            className={`flex items-center gap-1 text-slate-50 hover:text-slate-100 transition-colors ${openSupplier ? "text-slate-50/70" : ""}`}
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </button>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <button
            onClick={handleBackFromDetail}
            className={`text-slate-50 hover:text-slate-100 transition-colors ${openSupplier ? "text-slate-50/70" : ""}`}
          >
            {selectedSupplier.nome}
          </button>
          <ChevronRight className="h-3 w-3 text-slate-50" />
          <span className="text-slate-50 font-medium">
            Fattura {selectedInvoice.nrFattura}
          </span>
        </Header>
        <main className="flex-1 overflow-auto p-6">
          <div className="h-full">
            <InvoiceDetail
              invoice={selectedInvoice}
              supplier={selectedSupplier}
              onBack={handleBackFromDetail}
              onConfirm={handleConfirm}
              onReject={handleReject}
            />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <style>{animationStyles}</style>
      <Toaster position="top-right" richColors />

      <Header>
        <button
          onClick={handleBackToSuppliers}
          className={`flex items-center gap-1 text-slate-50 hover:text-slate-100 transition-colors ${openSupplier ? "text-slate-50/70" : ""}`}
        >
          <Home className="h-3.5 w-3.5" />
          Home
        </button>
        {openSupplier && (
          <>
            <ChevronRight className="h-3 w-3 text-slate-50" />
            <span className="text-slate-50 font-medium">
              {openSupplier.nome}
            </span>
          </>
        )}
      </Header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          {/* Title + search */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Fornitori</h1>
              <p className="text-sm text-slate-500">
                {openSupplier
                  ? `${openSupplier.fatture.length} fatture da ${openSupplier.nome}`
                  : "Seleziona una cartella per visualizzare le fatture"}
              </p>
            </div>
            <div className="relative w-full sm:w-72 mt-3 sm:mt-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca fornitore..."
                className="pl-9 bg-white border-slate-200"
              />
            </div>
          </div>

          {/* Folder grid - always visible */}
          <SupplierGrid
            suppliers={filteredSuppliers}
            openSupplierId={openSupplierId}
            onToggleSupplier={handleToggleSupplier}
          />

          {/* Invoice cards panel - appears below folders with animation */}
          {openSupplier && (
            <div ref={invoicesPanelRef}>
              <InvoiceCards
                supplier={openSupplier}
                onSelectInvoice={handleSelectInvoice}
                onConfirmGroup={handleConfirm}
                onRejectGroup={handleReject}
                onClose={() => setOpenSupplierId(null)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Header({ children }: { children: React.ReactNode }) {
  return (
    <header className="flex items-center gap-4 px-6 py-3 bg-slate-700 text-slate-50 border-b border-slate-200 shrink-0 shadow-sm">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-500" />
        <span className="font-bold text-sm tracking-wide">Gestione Fatture</span>
      </div>
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs ml-6"
      >
        {children}
      </nav>
    </header>
  )
}

