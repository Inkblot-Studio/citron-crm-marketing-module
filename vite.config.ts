import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'marketing',
      filename: 'remoteEntry.js',
      remotes: {
        host: process.env.VITE_HOST_URL
          ? `${process.env.VITE_HOST_URL}/assets/remoteEntry.js`
          : 'http://localhost:5173/assets/remoteEntry.js',
      },
      exposes: {
        './Marketing': './src/marketing/MarketingPage.tsx',
      },
      shared: ['react', 'react-dom', 'react-router-dom', '@citron-systems/citron-ui', '@citron-systems/citron-ds'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
})
