import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
        '@framework': resolve(__dirname, './src/Framework/src'),
    },
},
})
