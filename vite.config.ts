import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('html2canvas')) return 'html2canvas';
          if (
            id.includes('georaster-layer-for-leaflet') ||
            id.includes('/georaster/') ||
            id.includes('geotiff')
          ) return 'georaster';
          if (id.includes('react-leaflet') || id.includes('/leaflet/')) return 'leaflet';
        },
      },
    },
  },
})
