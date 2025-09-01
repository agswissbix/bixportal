"use client"

import { useState, useRef } from "react"
import { QRCodeCanvas } from "qrcode.react"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function QrGenerator() {
  const [employeeId, setEmployeeId] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [qrToken, setQrToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [qrSize, setQrSize] = useState("120")
  const qrRef = useRef<HTMLCanvasElement>(null)

  const generateQrFromServer = async () => {
    if (!employeeId || !companyId) return
    try {
      setLoading(true)
      const res = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "qr_issue",
          employeeId,
          companyId,
          ttl: 300,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )
      const data = res.data
      setQrToken(data.token)
    } catch (err) {
      console.error("Errore QR:", err)
    } finally {
      setLoading(false)
    }
  }

  const saveQr = () => {
    if (!qrRef.current) return
    const canvas = qrRef.current
    const url = canvas.toDataURL("image/png")
    const downloadLink = document.createElement("a")
    downloadLink.href = url
    downloadLink.download = `qr_${qrSize}px.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Generatore QR Code</h1>
        <p className="text-sm text-gray-600 mt-1">Genera un QR code per dipendente</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">QR Code Generato</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {qrToken ? (
            <>
              <div className="flex justify-center">
                <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <QRCodeCanvas
                    // imageSettings={{
                    //   src: "/bixdata/logos/swissbix_company.png",
                    //   height: 40,
                    //   width: 40,
                    //   excavate: true,
                    // }}
                    // bgColor="#ffffff"
                    value={qrToken}
                    size={Number.parseInt(qrSize) || 120}
                    ref={qrRef}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Contenuto QR:</p>
                <p className="text-xs text-gray-500 break-all bg-gray-50 p-2 rounded border">{qrToken}</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label htmlFor="qr-size" className="text-sm font-medium text-gray-700">
                    Dimensione QR (px)
                  </label>
                  <Input
                    id="qr-size"
                    type="number"
                    placeholder="120"
                    value={qrSize}
                    onChange={(e) => setQrSize(e.target.value)}
                    min="50"
                    max="500"
                    className="text-center"
                  />
                </div>
                <Button onClick={saveQr} variant="outline" className="w-full bg-transparent">
                  Scarica QR
                </Button>
              </div>
            </>
          ) : (
            <div className="py-8">
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-gray-500">Inserisci gli ID e genera il QR code</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Informazioni Dipendente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="employee-id" className="text-sm font-medium text-gray-700">
              Employee ID
            </label>
            <Input
              id="employee-id"
              type="text"
              placeholder="es: E001"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="company-id" className="text-sm font-medium text-gray-700">
              Company ID
            </label>
            <Input
              id="company-id"
              type="text"
              placeholder="es: 1"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            />
          </div>

          <Button onClick={generateQrFromServer} disabled={loading || !employeeId || !companyId} className="w-full">
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generazione in corso...
              </>
            ) : (
              "Genera QR Code"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
