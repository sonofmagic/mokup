import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { initTheme } from './utils/theme'
import './style.css'

initTheme()

createApp(App).use(i18n).mount('#app')
