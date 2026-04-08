'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BrowserMultiFormatReader,
  BinaryBitmap,
  HybridBinarizer,
  RGBLuminanceSource,
  NotFoundException,
} from '@zxing/library'

interface BarcodeScannerProps {
  onDetected: (result: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  const [boxWidthPct, setBoxWidthPct] = useState<number>(80)
  const [boxHeightPct, setBoxHeightPct] = useState<number>(30)

  const boxWidthRef = useRef(80)
  const boxHeightRef = useRef(30)
  const isProcessing = useRef(false)
  const lastResults = useRef<string[]>([])
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [flash, setFlash] = useState(false)

  // ── Camera setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream | null = null

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream

          const track = stream.getVideoTracks()[0]
          const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
            focusMode?: string[]
            zoom?: { min: number; max: number }
          }

          const advanced: MediaTrackConstraintSet[] = []
          if (capabilities.focusMode?.includes('continuous'))
            advanced.push({ focusMode: 'continuous' } as MediaTrackConstraintSet)
          if (capabilities.zoom)
            advanced.push({ zoom: 2.0 } as MediaTrackConstraintSet)

          if (advanced.length > 0) await track.applyConstraints({ advanced })

          videoRef.current.play()
          videoRef.current.onloadedmetadata = () => setScanning(true)
        }
      } catch {
        setErrorMessage('Fotocamera non disponibile.')
      }
    }

    startCamera()
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [])

  // ── ZXing reader init ───────────────────────────────────────────────────────
  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader()
    return () => {
      readerRef.current?.reset()
      readerRef.current = null
    }
  }, [])

  // ── Scan loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!scanning) return
    let animationFrameId: number

    const processFrame = () => {
      if (isProcessing.current || !videoRef.current || !canvasRef.current) {
        animationFrameId = requestAnimationFrame(processFrame)
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d', { willReadFrequently: true })

      if (video.readyState < 2 || !ctx) {
        animationFrameId = requestAnimationFrame(processFrame)
        return
      }

      isProcessing.current = true

      // 1. CALCOLO CROP — identico alla versione Quagga
      const vW = video.videoWidth
      const vH = video.videoHeight
      const cropW = vW * (boxWidthRef.current / 100)
      const cropH = vH * (boxHeightRef.current / 100)
      const sX = (vW - cropW) / 2
      const sY = (vH - cropH) / 2

      // 2. DOWNSAMPLING a 640px
      const targetWidth = 640
      const targetHeight = Math.round((cropH / cropW) * targetWidth)

      canvas.width = targetWidth
      canvas.height = targetHeight

      // 3. FILTRI — contrast + brightness + grayscale identici a prima
      ctx.filter = 'contrast(1.4) brightness(1.1) grayscale(1)'
      ctx.drawImage(video, sX, sY, cropW, cropH, 0, 0, targetWidth, targetHeight)
      ctx.filter = 'none'

      // 4. DECODE con ZXing da ImageData (più veloce di toDataURL usato da Quagga)
      try {
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)

        // Converti RGBA → luminanza con coefficienti BT.601
        const luminances = new Uint8ClampedArray(targetWidth * targetHeight)
        for (let i = 0; i < luminances.length; i++) {
          const b = i * 4
          luminances[i] = Math.round(
            imageData.data[b] * 0.299 +
            imageData.data[b + 1] * 0.587 +
            imageData.data[b + 2] * 0.114
          )
        }

        const source = new RGBLuminanceSource(luminances, targetWidth, targetHeight)
        const bitmap = new BinaryBitmap(new HybridBinarizer(source))

        // decodeBitmap() accetta BinaryBitmap direttamente — sincrono, nessun round-trip JPEG
        const result = readerRef.current!.decodeBitmap(bitmap)
        const code = result.getText()

        // DEDUPLICA: stessa logica originale (2 letture consecutive uguali)
        lastResults.current.push(code)
        if (lastResults.current.length > 2) lastResults.current.shift()

        if (
          lastResults.current.length === 2 &&
          lastResults.current[0] === lastResults.current[1]
        ) {
          onDetected(code)
          lastResults.current = []
          // Flash feedback: accende il mirino verde per 400ms
          setFlash(true)
          setTimeout(() => setFlash(false), 400)
        }

        // ZXing è sincrono e più veloce: 50ms di cooldown sono sufficienti
        setTimeout(() => { isProcessing.current = false }, 50)
      } catch (e) {
        // NotFoundException = nessun barcode nel frame, è normalissimo
        if (!(e instanceof NotFoundException)) {
          console.warn('[zxing]', e)
        }
        isProcessing.current = false
      }

      animationFrameId = requestAnimationFrame(processFrame)
    }

    animationFrameId = requestAnimationFrame(processFrame)
    return () => cancelAnimationFrame(animationFrameId)
  }, [scanning, onDetected])

  // ── UI — identica alla versione originale ───────────────────────────────────
  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden border-2 border-gray-800">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-30 bg-red-600 text-white p-2 rounded-full shadow-xl"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative flex-1">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-lg relative transition-all duration-150"
            style={{
              width: `${boxWidthPct}%`,
              height: `${boxHeightPct}%`,
              border: flash ? '3px solid #22c55e' : '2px solid #ef4444',
              boxShadow: flash
                ? '0 0 0 9999px rgba(0,0,0,0.6), 0 0 20px 4px rgba(34,197,94,0.7)'
                : '0 0 0 9999px rgba(0,0,0,0.6)',
              backgroundColor: flash ? 'rgba(34,197,94,0.15)' : 'transparent',
            }}
          >
            {/* Scan line — nascosta durante il flash */}
            {!flash && (
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500/60 shadow-[0_0_8px_red]" />
            )}
            {/* Checkmark al centro durante il flash */}
            {flash && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <p className="text-white text-sm px-6 text-center">{errorMessage}</p>
        </div>
      )}

      <div className="bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500">DIMENSIONI MIRINO</span>
          <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-400">ZXing · Multi-format</span>
        </div>
        <div className="space-y-4">
          <input
            type="range" min="40" max="95" value={boxWidthPct}
            onChange={(e) => {
              setBoxWidthPct(Number(e.target.value))
              boxWidthRef.current = Number(e.target.value)
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none accent-red-600"
          />
          <input
            type="range" min="10" max="60" value={boxHeightPct}
            onChange={(e) => {
              setBoxHeightPct(Number(e.target.value))
              boxHeightRef.current = Number(e.target.value)
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none accent-red-600"
          />
        </div>
      </div>
    </div>
  )
}