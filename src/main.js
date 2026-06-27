import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { useFamilyStore } from './stores/pinia'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)

const store = useFamilyStore()
store.loadFromStorage()
window.__FAMILY_TREE__ = store.tree

app.mount('#app')
