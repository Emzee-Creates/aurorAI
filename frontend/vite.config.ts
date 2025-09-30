import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // IMPORTANT: Set the base path to match the subpath you are deploying to.
  // This ensures Vite's build correctly prefixes all asset URLs (JS, CSS, images).
  base: '/dashboard/', 
  
  plugins: [react()],

  // Since your Vite app is in the 'frontend/' subdirectory, 
  // the output directory 'dist' will be created within 'frontend/dist'.
  build: {
    outDir: 'dist', 
    emptyOutDir: true
  }
})
