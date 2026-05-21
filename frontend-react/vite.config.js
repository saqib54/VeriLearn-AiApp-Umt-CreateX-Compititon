import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { qrcode } from 'vite-plugin-qrcode'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    qrcode(), // Prints a premium scan-ready QR code in the terminal!
    basicSsl() // Generates self-signed local SSL certificate automatically!
  ],
  server: {
    host: true, // Exposes the Vite dev server to the local Wi-Fi network automatically!
    https: true // Forces Secure Context (HTTPS) for mobile screen sharing and voice support!
  }
})
