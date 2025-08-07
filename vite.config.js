import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"], // Separate React into its own chunk
          store: ["react-redux", "@reduxjs/toolkit"],
          kaplay: ["kaplay", "kaplay-atb-plugin"],
        },
      },
    },
  },  
})
