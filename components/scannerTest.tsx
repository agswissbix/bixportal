"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const BarcodeScanner = dynamic(() => import("@/components/barcodeScanner"), {
    ssr: false, 
    loading: () => (
        <div className="text-center p-4">Caricamento scanner...</div>
    ),
});

export default function Home() {
    const [isScanning, setIsScanning] = useState(false);
    const [barcodeResult, setBarcodeResult] = useState<string | null>(null);

    const handleBarcodeDetected = (result: string) => {
        setBarcodeResult(result);
        setIsScanning(false);
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-4 bg-gray-100">
            <div className="w-full max-w-md mx-auto">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    Scanner di Codici a Barre
                </h1>

                {!isScanning ? (
                    <div className="flex flex-col items-center gap-6">
                        <button
                            onClick={() => setIsScanning(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transition-colors w-64">
                            Scansiona
                        </button>

                        {barcodeResult && (
                            <div className="mt-6 p-4 bg-white rounded-lg shadow w-full">
                                <h2 className="text-lg font-semibold mb-2">
                                    Risultato:
                                </h2>
                                <p className="text-xl break-all">
                                    {barcodeResult}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full">
                        <BarcodeScanner
                            onDetected={handleBarcodeDetected}
                            onClose={() => setIsScanning(false)}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}
