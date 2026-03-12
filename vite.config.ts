import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['@tanstack/react-query', '@rainbow-me/rainbowkit', 'wagmi', 'viem'],
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});
