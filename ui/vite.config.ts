import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import envCompatible from 'vite-plugin-env-compatible'
import svgLoader from '@honkhonk/vite-plugin-svgr'
import * as path from 'path'

const SERVER_PORT = process.env.SERVER_PORT || 8888

// Workaround to  "WindowScroller.js" for import "bpfrpt_proptype_WindowScroller"
// https://github.com/bvaughn/react-virtualized/issues/1212
const importReactVirtualized = {
  name: 'import-react-virtualized',
  setup(build: any) {
    build.onResolve({filter: /react-virtualized/}, async () => {
      return {
        path: path.resolve(
          '../node_modules/react-virtualized/dist/umd/react-virtualized.js'
        ),
      }
    })
  },
}

// TODO use: process.env.npm_package_version, process.env.GIT_SHA

export default defineConfig({
  plugins: [
    importReactVirtualized,
    react({fastRefresh: process.env.NODE_ENV !== 'test'}),
    svgLoader(),
    envCompatible({prefix: ''}),
  ],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [importReactVirtualized],
    },
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
      shared: path.resolve(__dirname, 'src', 'shared'),
      utils: path.resolve(__dirname, 'src', 'utils'),
    },
  },
  server: {
    port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 8080,
    proxy: {
      '/chronograf/v1': {
        target: `http://localhost:${SERVER_PORT}`,
        changeOrigin: true,
      },
      '/oauth': {
        target: `http://localhost:${SERVER_PORT}`,
        changeOrigin: true,
      },
    },
  },
})
