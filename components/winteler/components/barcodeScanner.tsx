import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScanner({ onScanSuccess, onScanError }) {
    // --- Refs ---
    const readerRef = useRef(null);

    // --- Stati ---
    const [scanner, setScanner] = useState(null);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [hasCameras, setHasCameras] = useState(false);
    const [isScannerReady, setIsScannerReady] = useState(false);

    // --- Callbacks ---
    const handleScanSuccess = (decodedText) => {
        onScanSuccess?.(decodedText);
        stopScanning();
    };
    const handleScanError = (errorMessage) => {
        !errorMessage.containts("QR code parse error") ? onScanError?.(errorMessage) : '';
    }

  // --- Effetto per l'Inizializzazione ---
    useEffect(() => {
        if (readerRef.current) { 
            const html5QrcodeScanner = new Html5Qrcode(readerRef.current.id);
            setScanner(html5QrcodeScanner);
            setIsScannerReady(true); 

            Html5Qrcode.getCameras()
                .then(devices => {
                    if (devices && devices.length) {
                        setHasCameras(true);
                        setCameras(devices);
                        const rearCamera = devices.find(d => d.label.toLowerCase().includes('back'));
                        setSelectedCamera(rearCamera ? rearCamera.id : devices[0].id);
                    }
            })
                .catch(err => {
                    console.log("Nessuna fotocamera trovata o permessi negati.", err);
                    setHasCameras(false);
            });
        }

        // --- Cleanup ---
        return () => {
            if (scanner && typeof scanner.getState === 'function' && scanner.getState() === 2) {
                scanner.stop().catch(err => console.error("Errore durante lo stop:", err));
            }
        };
    }, []);

    // --- Funzioni di Controllo ---
    const startScanning = () => {
        if (scanner && selectedCamera) {
            scanner.start(
                selectedCamera,
                { fps: 10, qrbox: { width: 250, height: 250 } },
                handleScanSuccess,
                handleScanError
            ).catch(err => console.error("Impossibile avviare lo scanner:", err));
        }
    };

    const stopScanning = () => {
        if (scanner && typeof scanner.getState === 'function' && scanner.getState() === 2) {
            scanner.stop().catch(err => console.error("Errore durante lo stop:", err));
        }
    };
    
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        
        if (file && scanner) {
            stopScanning();
            scanner.scanFile(file, true)
                .then(handleScanSuccess)
                .catch(handleScanError);
        }
    };

    return (
        <div>
            <div 
                id="barcode-reader" 
                ref={readerRef} 
                style={{ display: hasCameras ? 'block' : 'none', width: '100%' }}
            ></div>

            {hasCameras ? (
                <div className="text-center p-4 mb-4 bg-gray-50 border border-gray-200">
                    <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Scegli Fotocamera:
                    </label>
                    <select
                        id="camera-select"
                        value={selectedCamera}
                        onChange={(e) => setSelectedCamera(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md"
                        >
                        {cameras.map((camera) => (
                            <option key={camera.id} value={camera.id}>
                                {camera.label || `Fotocamera ${camera.id}`}
                            </option>
                        ))}
                    </select>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <button onClick={startScanning} className="w-full px-4 py-2 bg-black text-white">
                            Avvia
                        </button>
                        <button onClick={stopScanning} className="w-full px-4 py-2 bg-black text-white">
                            Ferma
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center p-4 mb-4 bg-gray-50 border border-gray-200">
                    <p className="text-sm text-gray-800">
                            Nessuna fotocamera trovata o permessi negati. Puoi caricare un'immagine.
                    </p>
                </div>
            )}

            <div className="text-center">
                <input 
                    id="file-input"
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={!isScannerReady}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>
        </div>
    );
}