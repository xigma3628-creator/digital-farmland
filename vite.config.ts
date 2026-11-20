import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import vueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { fileURLToPath } from 'url'
import vitePluginCesium from './plugins/vite.plugin.cesium'

export default defineConfig(({ command, mode }) => {
  const alias = [{ find: '@', replacement: resolve(__dirname, 'src') }]
  return {
    base: '/three.js-demo/digital-farmland/', // 新增这一行
    plugins: [
      vitePluginCesium(),
      vueI18nPlugin({
        include: resolve(dirname(fileURLToPath(import.meta.url)), './src/i18n/languages/**'),
      }),
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      createSvgIconsPlugin({
        iconDirs: [
          resolve(process.cwd(), 'src/components/jt-global-register/components/jt-icon/svgs'),
        ],
        symbolId: '[name]',
        inject: 'body-last',
        customDomId: '__jt__svg__icons__dom__',
      }),
    ],
    resolve: {
      alias,
    },
    build: {
      rollupOptions: {
        // 十一期多页入口：index.html（大屏/管理端）与 worker.html（工人端 H5）并列
        input: {
          main: resolve(__dirname, 'index.html'),
          worker: resolve(__dirname, 'worker.html'),
        },
      },
    },
    server: {
      proxy: {
        // 高德卫星瓦片同源代理：规避浏览器端跨域/Referer 等加载问题
        '/amap-tiles': {
          target: 'https://webst01.is.autonavi.com',
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/amap-tiles/, ''),
        },
      },
    },
  }
})
