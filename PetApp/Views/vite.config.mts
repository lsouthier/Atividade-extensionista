import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
    plugins: [react()],
    assetsInclude: ['**/*.JPG', '**/*.jpeg'],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'https://localhost:44303',
                changeOrigin: true,
                secure: false,
                // ignorar caminhos que terminam em .ts, .tsx, .json que s�o do front
                bypass: (req) => {
                    if (req.url && (req.url.includes('.ts') || req.url.includes('.tsx') || req.url.includes('.json'))) {
                        return req.url; // Retornando req.url faz o Vite servir o arquivo e ignorar o proxy
                    }       
                }
            }
        }
    },
    root: './src',
    build: {
        outDir: '../dist',
        emptyOutDir: true
    }
});