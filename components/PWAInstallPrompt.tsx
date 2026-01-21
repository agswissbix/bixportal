'use client';

import { useEffect, useState } from 'react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-bold mb-2">Installa BixData</h3>
      <p className="text-sm mb-4">Installa l&apos;app per accedervi velocemente dal tuo dispositivo.</p>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 bg-white text-blue-600 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition"
        >
          Installa
        </button>
        <button
          onClick={handleDismiss}
          className="flex-1 bg-transparent border border-white font-semibold px-4 py-2 rounded hover:bg-white hover:bg-opacity-10 transition"
        >
          Non adesso
        </button>
      </div>
    </div>
  );
}
