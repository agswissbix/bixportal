import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Ottimizzazione delle dimensioni dell'immagine per Docker

  reactStrictMode: false,
  devIndicators: {
    appIsrStatus: false,     // nasconde il badge "Static/Dynamic route"
    buildActivity: false,    // nasconde lo spinner di compilazione
    // buildActivityPosition: 'bottom-left', // opzionale
  },
  //TODO: Rivedere questa configurazione per la produzione per le porte
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      //Eventualmente, aggiungi altri pattern per un dominio di produzione:
      {
         protocol: 'https',
         hostname: 'localhost',
         port: '3002',
         pathname: '/**',
       },
    ],
  },
};

export default nextConfig;
