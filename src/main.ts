import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import piniaStore from './store';

import '@/styles/index.less';
import '@/styles/reset.less';
import 'uno.css';

// 支持SVG
import 'virtual:svg-icons-register';
import '@arco-design/web-vue/dist/arco.css';
import Idux from '@/config/idux';

// DevUI
import 'vue-devui/style.css';
import '@devui-design/icons/icomoon/devui-icon.css';

import { ThemeServiceInit, devuiDarkTheme } from 'devui-theme';

import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/es/locale/lang/zh-cn'; // 引入中文语言包

const themeService = ThemeServiceInit({ devuiDarkTheme }, 'infinityTheme');

themeService?.applyTheme(devuiDarkTheme);

//vue3的挂载方式
const app = createApp(App);

app.use(ElementPlus, {
  locale: zhCn, // 设置全局语言为中文
});
app.use(router);
app.use(piniaStore);
app.use(Idux);

app.mount('#app');
