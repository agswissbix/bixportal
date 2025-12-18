import type { NextConfig } from "next";

const isDockerBuild =
    process.env.DOCKER_BUILD === "true" || process.env.DOCKER_BUILD === "1";

const nextConfig: NextConfig = {
    //...(isDockerBuild && { output: "standalone" }), // Ottimizzazione delle dimensioni dell'immagine per Docker

    output: "standalone",
    
    poweredByHeader: false,

    reactStrictMode: true,

    devIndicators: {
        // buildActivity: false, // Decommenta se vuoi nascondere lo spinner
        position: "bottom-left",
    },

    allowedDevOrigins: ["localhost", "devstagista.swissbix.com", "devale.swissbix.com", "pc-pitgestional"],

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

export default nextConfig;
