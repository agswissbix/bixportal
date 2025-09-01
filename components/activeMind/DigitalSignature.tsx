"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pen, RotateCcw, Check, X, Edit } from "lucide-react"

interface DigitalSignatureProps {
  onSignatureChange?: (signature: string | null) => void
}

export default function DigitalSignature({ onSignatureChange }: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [isSignatureMode, setIsSignatureMode] = useState(false)
  const [savedSignature, setSavedSignature] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 400
    canvas.height = 150

    // Set drawing styles
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Clear canvas with white background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [isSignatureMode])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)

    let clientX, clientY
    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let clientX, clientY
    if ("touches" in e) {
      e.preventDefault()
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    setHasSignature(true)
  }

  const clearSignature = () => {
    setSavedSignature(null)
    setHasSignature(false)
    onSignatureChange?.(null)

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return

    const signatureData = canvas.toDataURL("image/png")
    setSavedSignature(signatureData)
    onSignatureChange?.(signatureData)
    setIsSignatureMode(false)
  }

  const cancelSignature = () => {
    setIsSignatureMode(false)
    clearSignature()
  }

  const editSignature = () => {
    setIsSignatureMode(true)
    // Load existing signature into canvas if available
    if (savedSignature) {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        setHasSignature(true)
      }
      img.src = savedSignature
    }
  }

  if (!isSignatureMode) {
    return (
      <div className="text-right">
        <p className="text-sm text-gray-600 mb-2">Per Accettazione</p>

        {savedSignature ? (
          <div className="mb-2">
            <div className="border border-gray-300 rounded p-2 bg-white inline-block mb-2">
              <img
                src={savedSignature || "/placeholder.svg"}
                alt="Firma digitale"
                className="max-w-48 h-auto"
                style={{ maxHeight: "75px" }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={editSignature} variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-1" />
                Modifica Firma
              </Button>
              <Button onClick={clearSignature} variant="outline" size="sm">
                <X className="w-4 h-4 mr-1" />
                Rimuovi Firma
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button onClick={() => setIsSignatureMode(true)} variant="outline" className="mb-2">
              <Pen className="w-4 h-4 mr-2" />
              Firma Digitalmente
            </Button>
            <div className="border-b border-gray-400 w-48 h-8"></div>
          </>
        )}
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Pen className="w-5 h-5 mr-2" />
          Firma Digitale
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">Disegna la tua firma nell'area sottostante</p>

          <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
            <canvas
              ref={canvasRef}
              className="border border-gray-200 rounded cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-2">Usa il mouse o il dito per disegnare la firma</p>
        </div>

        <div className="flex gap-2 justify-center">
          <Button onClick={clearSignature} variant="outline" size="sm" disabled={!hasSignature}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Cancella
          </Button>

          <Button
            onClick={saveSignature}
            size="sm"
            disabled={!hasSignature}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-1" />
            Conferma
          </Button>

          <Button onClick={cancelSignature} variant="outline" size="sm">
            <X className="w-4 h-4 mr-1" />
            Annulla
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
