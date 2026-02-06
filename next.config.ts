import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

const isDockerBuild =
    process.env.DOCKER_BUILD === "true" || process.env.DOCKER_BUILD === "1";

const nextConfig: NextConfig = {
    //...(isDockerBuild && { output: "standalone" }), // Ottimizzazione delle dimensioni dell'immagine per Docker

    output: "standalone",
    
    poweredByHeader: false,

    reactStrictMode: true,

    turbopack: {},
    // webpack: (config, { isServer }) => {
    //     // Forza l'uso di webpack anche se Next vorrebbe altro
    //     return config;
    // },

    devIndicators: {
        // buildActivity is now handled automatically or removed; just set the position
        position: "bottom-left",
    },

    allowedDevOrigins: ["localhost", "devstagista.swissbix.com", "devriccardo.swissbix.com", "devale.swissbix.com", "pc-pitgestional"],

    //TODO: Rivedere questa configurazione per la produzione per le porte
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "localhost",
                port: "3000",
                pathname: "/**",
            },
            //Eventualmente, aggiungi altri pattern per un dominio di produzione:
            {
                protocol: "https",
                hostname: "localhost",
                port: "3002",
                pathname: "/**",
            },
            // Esempio per produzione (sostituisci col dominio reale quando serve)
            {
                protocol: "https",
                hostname: "swissbix.com",
                port: "",
                pathname: "/**",
            },
        ],
    },
};

export default withPWA(nextConfig);
