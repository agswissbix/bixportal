export type BixAppConfig = {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  background_color: string;
  theme_color: string;
  icons: {
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
  }[];
};

export const defaultManifest: BixAppConfig = {
  name: "BixData",
  short_name: "BixData",
  description: "Applicazione gestionale BixData",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#000000",
  icons: [
    {
      src: "/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    }
  ]
};

export const bixAppsConfigs: Record<string, Partial<BixAppConfig>> = {
  timetracking: {
    name: "BixData Timetracking",
    short_name: "Timetracking",
    description: "Gestione Timetracking BixData",
    start_url: "/bixApps/timetracking",
    theme_color: "#2563eb", // Example blue
  },
  timesheet: {
    name: "BixData Timesheet",
    short_name: "Timesheet",
    description: "Gestione Timesheet BixData",
    start_url: "/bixApps/timesheet",
    theme_color: "#16a34a", // Example green
  },
  aiAgent: {
    name: "BixData AI Agent",
    short_name: "AI Agent",
    description: "Assistente AI BixData",
    start_url: "/bixApps/aiAgent",
    theme_color: "#9333ea", // Example purple
  },
  bixMobileHub: {
    name: "BixData Mobile Hub",
    short_name: "Mobile Hub",
    description: "Hub mobile BixData",
    start_url: "/bixApps/bixMobileHub",
    theme_color: "red", // Example red
  }
};
