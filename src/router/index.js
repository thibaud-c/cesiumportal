import { createRouter, createWebHashHistory } from 'vue-router';
import routes from './routes';
import * as Vue from 'vue';

export default createRouter({
  history: createWebHashHistory(),
  base: process.env.BASE_URL,
  routes
});
