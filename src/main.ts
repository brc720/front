import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '../router/index'
import App from './App.vue'
// import './utils/rem.js' // 屏幕适配
import './style.css'
import 'element-plus/dist/index.css'
import '@/assets/my.less'

const app = createApp(App)
const pinia = createPinia()
app.use(router)
app.use(pinia)
  .mount('#app')
