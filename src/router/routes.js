import VCesium from './../views/ViewCesium.vue';
import VHome from './../views/ViewHome.vue';
import VNotfound from './../views/View404.vue';

const routes = [
  {
    path: '',
    name: 'Home',
    component: VHome
  },
  {
    path: '/cesium',
    name: 'Cesium',
    component: VCesium
  },
  {
    path: '/:catchAll(.*)',
    name: '404 page',
    component: VNotfound
  }
];

export default routes;
