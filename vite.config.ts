import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({base:'/yutori-festival-ops/',plugins:[react(),tailwindcss()]});
