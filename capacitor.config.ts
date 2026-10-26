import type { CapacitorConfig } from "@capacitor/cli";

// The ID is provisional until an App Store publisher and permanent bundle ID are chosen.
// Release builds always load the bundled dist/ assets, never a remote server.url.
const config: CapacitorConfig = {
  appId: "org.lavoix.mobile",
  appName: "LA VOIX",
  webDir: "dist",
  ios: {
    contentInset: "automatic",
  },
};

export default config;
