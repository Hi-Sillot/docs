import { defineClientConfig } from "vuepress/client";

import Layout from "./layouts/Layout.vue";
import AuthorDetail from "./layouts/AuthorDetail.vue";
import AuthorList from "./layouts/AuthorList.vue";
import { createPinia } from "pinia";
import { useAuthorStore } from "./stores/author";
import { useBioChainStore } from "./stores/bioChain";

import "./styles/index.css";

export default defineClientConfig({
  setup() {

  },
  layouts: {
    Layout,
    // 声明自定义组件，否则无法全局使用
    AuthorList,
    AuthorDetail,
  },
  enhance({ app, router }) {
    // built-in components
    // app.component('RepoCard', RepoCard)
    // app.component('NpmBadge', NpmBadge)
    // app.component('NpmBadgeGroup', NpmBadgeGroup)
    // app.component('Swiper', Swiper) // you should install `swiper`

    // 注册Pinia状态管理
    const pinia = createPinia();
    app.use(pinia);

    // 初始化存储
    const authorStore = useAuthorStore();
    // @ts-ignore
    import("@temp/author-data.ts").then((module) => {
      console.log("@temp/author-data.ts ok", module.default);
      // 将数据存入Pinia存储
      authorStore.setAuthors(module.default);
      // 动态注册路由，必须有对应的文件存在
      router.addRoute({
        path: "/authors/:slug/",
        component: AuthorDetail,
        name: "AuthorDetail",
      });
    });

    // 初始化存储
    const bioStore = useBioChainStore();
    // @ts-ignore
    import("@temp/bio.ts").then((module) => {
      console.log("@temp/bio.ts ok", module.f(bioStore, app));
      // 将数据存入Pinia存储
      // bioStore.setPageData(module.default)
      // bioStore.generateLocalMap(module.default)
    });
  },
})
