// components/BarcodeScanner.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Quagga from '@ericblade/quagga2'

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
  const [boxHeightPct, setBoxHeightPct] = useState<number>(40)
  const boxWidthRef = useRef(80)
  const boxHeightRef = useRef(40)

  useEffect(() => {
    // Dichiarazione variabile per l'eventuale cleanup
    let stream: MediaStream | null = null;

    // Funzione per inizializzare la fotocamera
    const startCamera = async () => {
      try {
        if (!videoRef.current) return;

        // Richiedi l'accesso alla fotocamera
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Usa la fotocamera posteriore
            width: { min: 1280 },
            height: { min: 720 }
          },
          audio: false
        });

        // Collega lo stream al video element
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Inizia la scansione una volta che il video è pronto
        videoRef.current.onloadedmetadata = () => {
          setScanning(true);
        };
      } catch (err) {
        console.error('Errore accesso fotocamera:', err);
        setErrorMessage('Impossibile accedere alla fotocamera. Assicurati di aver concesso i permessi necessari.');
      }
    };

    // Avvia la fotocamera
    startCamera();

    // Pulisci le risorse quando il componente viene smontato
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setScanning(false);
    };
  }, []);

  // Effetto per il processo di scansione
  useEffect(() => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    // Timer per catturare frames e processarli
    const scanInterval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const pctW = boxWidthRef.current / 100;
      const pctH = boxHeightRef.current / 100;
      
      const cropWidth = video.videoWidth * pctW;
      const cropHeight = video.videoHeight * pctH;
      const startX = (video.videoWidth - cropWidth) / 2;
      const startY = (video.videoHeight - cropHeight) / 2;

      // Imposta le dimensioni del canvas per corrispondere al crop box
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      // ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      ctx.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      
      // Processa l'immagine con Quagga (in modalità statica)
      Quagga.decodeSingle({
        decoder: {
          readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader', 'code_39_vin_reader', 'codabar_reader', 'upc_reader', 'upc_e_reader']
        },
        locate: true,
        src: canvas.toDataURL('image/jpeg')
      }, (result) => {
        if (result && result.codeResult) {
          // Barcode trovato
          if (result.codeResult.code) {
            onDetected(result.codeResult.code);
          }
        }
      });
    }, 400); // Prova a scansionare ogni 400ms
    
    return () => {
      clearInterval(scanInterval);
    };
  }, [scanning, onDetected]);

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden rounded-lg">
      <button 
        className="absolute top-2 right-2 z-20 bg-red-500/80 text-white p-2 rounded-full shadow-lg backdrop-blur-sm"
        onClick={onClose}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      {errorMessage ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
          {errorMessage}
        </div>
      ) : (
        <>
          <div className="relative bg-black flex-1 min-h-0 w-full overflow-hidden" >
            {/* Video element (visibile) */}
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Canvas element (nascosto) per il processing */}
            <canvas 
              ref={canvasRef} 
              className="hidden"
            />
            
            {/* Overlay per il mirino */}
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
              <div 
                className="relative border-[3px] border-[#E2231A] transition-all duration-200 ease-out"
                style={{
                  width: `${boxWidthPct}%`,
                  height: `${boxHeightPct}%`,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                  borderRadius: '12px'
                }}
              >
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 flex flex-col gap-2 shrink-0 border-t border-gray-200">
            <div className="text-center text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">
              Area di inquadratura
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 font-bold shrink-0 w-14">Larg.</span>
              <input 
                type="range" 
                min="20" 
                max="95" 
                value={boxWidthPct} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setBoxWidthPct(val);
                  boxWidthRef.current = val;
                }}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E2231A]"
              />
              <span className="text-[10px] text-gray-400 shrink-0 w-6 text-right">{boxWidthPct}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 font-bold shrink-0 w-14">Alt.</span>
              <input 
                type="range" 
                min="10" 
                max="95" 
                value={boxHeightPct} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setBoxHeightPct(val);
                  boxHeightRef.current = val;
                }}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E2231A]"
              />
              <span className="text-[10px] text-gray-400 shrink-0 w-6 text-right">{boxHeightPct}%</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}