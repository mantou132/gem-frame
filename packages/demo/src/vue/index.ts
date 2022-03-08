import Vue from 'vue';
import VueRouter from 'vue-router';

import App from './App.vue';

Vue.use(VueRouter);

const app = new Vue({
  router: new VueRouter({
    mode: 'history',
    routes: [
      {
        path: '/',
        name: 'home',
        component: () => import('./Home.vue'),
      },
      {
        path: '/b',
        name: 'about',
        component: () => import('./About.vue'),
      },
    ],
  }),
  render: h => h(App),
}).$mount(document.body.appendChild(document.createElement('div')));

addEventListener('hosturlchange', () => {
  if (app.$route.path !== location.pathname) {
    app.$router.replace(location.pathname);
  }
});
