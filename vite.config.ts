import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 1234,
    strictPort: true,
    // تمكين CORS للوصول من الجوال
    cors: true,
    // إعدادات إضافية للشبكة المحلية
    hmr: {
      host: '192.168.1.56'
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react-router-dom']
  },
  build: {
    // تحسين الأداء
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['lucide-react']
        }
      }
    }
  },
  // تحسين الأداء
  esbuild: {
    target: 'esnext'
  }
});
