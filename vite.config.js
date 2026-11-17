import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/three/")) return "three";
          if (id.includes("/node_modules/@react-three/") || id.includes("/node_modules/three-stdlib/")) return "react-three";
          if (id.includes("/node_modules/framer-motion/") || id.includes("/node_modules/motion-")) return "motion";
          if (id.includes("/node_modules/react/") || id.includes("/node_modules/scheduler/")) return "react-vendor";
        },
      },
    },
  },
});