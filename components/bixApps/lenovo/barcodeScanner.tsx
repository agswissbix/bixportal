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
      
      // Imposta le dimensioni del canvas per corrispondere al video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Disegna il frame corrente sul canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Ottieni i dati dell'immagine
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
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
          clearInterval(scanInterval);
        }
      });
    }, 500); // Prova a scansionare ogni 500ms
    
    return () => {
      clearInterval(scanInterval);
    };
  }, [scanning, onDetected]);

  return (
    <div className="relative w-full">
      <button 
        className="absolute top-4 right-4 z-10 bg-red-500 text-white p-2 rounded-full"
        onClick={onClose}
      >
        ✕
      </button>
      
      {errorMessage ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
          {errorMessage}
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-lg shadow-lg">
          <div className="relative bg-black" >
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
            <div className="absolute inset-0 border-2 border-yellow-400 opacity-50 z-10 pointer-events-none">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-3/4 h-3/4 border-2 border-yellow-400 border-dashed"></div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 text-center text-gray-700">
            Posiziona il codice a barre all'interno dell'area evidenziata
          </div>
        </div>
      )}
    </div>
  )
}