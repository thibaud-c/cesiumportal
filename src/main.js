import createApp from 'vue';
import * as Vue from 'vue';
import App from './App.vue';

import 'bulma/css/bulma.css';
import 'bulma-switch/dist/css/bulma-switch.min.css';

//import i18n from './i18n';
import router from './router';

const app = createApp(App);
app.use(router);
app.mount('#app');

// Add libs
//app.use(i18n);
