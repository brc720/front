import { defineConfig } from 'vite'
// import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router'],
      dts: "src/auto-import.d.ts",
      eslintrc: {
        enabled: true
      }
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dirs: ['src/components', 'src/**/*/components'],
      dts: "src/components.d.ts"
    }),
    wasm(),
    nodePolyfills({
      protocolImports: true,
    }),
    topLevelAwait()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    }
  },
  build: {
    outDir: 'dist'
  },

  server: {
    host: '0.0.0.0',
    port: 4000,

    proxy: {
      // '/api': {
      //   target: 'https://api.brc720.com/',
      //   changeOrigin: true,
      //   secure: false, // 如果是https接口，需要配置这个参数
      //   rewrite: path => path.replace(/^\/api/, '')
      // }
    }
  }
})
