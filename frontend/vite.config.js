import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Keep recharts in its own chunk because it is large
            if (id.includes('recharts')) {
              return 'recharts';
            }
            // Everything else goes into 'vendor'
            return 'vendor'; 
          }
        },
      },
    },
  },
});