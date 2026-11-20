// 十一期：工人端独立入口。不引入管理端布局/大屏依赖，仅挂载工人端根组件。
// v-loading 指令需显式注册（工人端没有像管理端那样全量 app.use(ElementPlus)）。
import { createApp } from 'vue'
import { ElLoading } from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import './style.css'

createApp(App).use(ElLoading).mount('#worker-app')
