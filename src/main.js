import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import http from './http'
import App from './App.vue'

import 'font-awesome/css/font-awesome.css'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.config.productionTip = false
Vue.prototype.$http = http
Vue.use(BootstrapVue)

new Vue({
  render: h => h(App)
}).$mount('#app')
