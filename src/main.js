import Vue from 'vue'
import App from './app.vue'
import router from './router'
import store from './store/index'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import './style/index.scss'

Vue.config.productionTip = false

Vue.use(Antd)

console.log(store)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

