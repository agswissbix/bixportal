import { useEffect } from 'react';

export function usePWA() {
  useEffect(() => {
    // Registra il service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }

    // Gestisci l'evento di installazione dell'app
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log('beforeinstallprompt event fired');
    });

    // Ascolta le modifiche dello stato dell'app installata
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      deferredPrompt = null;
    });
  }, []);
}
