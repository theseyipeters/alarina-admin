import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// The staff admin app. It calls the API directly at VITE_API_URL; refuse to build without it.
// The API only accepts it from ADMIN_ORIGIN (be/.env), which is this dev server's address.
export default defineConfig(({ mode }) => {
  if (!loadEnv(mode, process.cwd()).VITE_API_URL) {
    throw new Error(`VITE_API_URL is not set for "${mode}". Add it to admin/.env.${mode} (e.g. http://localhost:5001).`)
  }

  return {
    plugins: [react()],
    server: { port: 5174, strictPort: true },
    preview: { port: 5174, strictPort: true },
  }
})
