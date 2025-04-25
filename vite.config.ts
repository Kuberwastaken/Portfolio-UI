import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import vercel from "vite-plugin-vercel";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: process.env.PORT as unknown as number,
    cors: {
      origin: ["*"],
    },
  },
  plugins: [react(), tailwindcss(), vercel()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  vercel: {
    defaultSupportsResponseStreaming: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
          ],
          audio: ["tone", "wavesurfer.js", "audio-buffer-utils"],
        },
      },
    },
    sourcemap: false,
    minify: true,
  },
});
