import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
         hostname: 'localhost:3002',
         port: '',
         pathname: '/**',
       },
    ],
  },
};

export default nextConfig;
