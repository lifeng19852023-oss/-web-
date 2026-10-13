import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import permission from './directives/permission'


const app = createApp(App)

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 在原有的 createApp(App) 后添加
app.use(ElementPlus)

app.use(createPinia())
app.use(router)

app.directive(
    'permission',
    permission
  )




app.mount('#app')