import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { store, key } from './store'
import register from './components/jt-global-register'
import i18n from './i18n'

// global css
import './assets/styles/index.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// cesium vue
import cesiumVue from './libs/cesium/cesium-vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(store, key).use(router).use(cesiumVue).use(i18n)

register(app)
app.use(ElementPlus)
app.mount('#app')
