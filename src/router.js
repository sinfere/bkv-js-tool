import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/home.vue'
import Pack from './views/pack.vue'
import Unpack from './views/unpack.vue'
import Schema from './views/schema.vue'

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/pack',
      name: 'pack',
      component: Pack
    },
    {
      path: '/unpack',
      name: 'unpack',
      component: Unpack
    },
    {
      path: '/schema',
      name: 'schema',
      component: Schema
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/about.vue')
    }
  ]
})
