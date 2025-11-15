import { defineClientConfig } from "vuepress/client";
import { setup } from "@css-render/vue3-ssr";
import { NaiveUI } from "./modules/NaiveUi";

// 布局
import Layout from "./layouts/Layout.vue";
import AuthorDetail from "./plugins/vuepress-plugin-sillot-author/components/AuthorDetailPage.vue";
import AuthorList from "./plugins/vuepress-plugin-sillot-author/components/AuthorListPage.vue";
// 组件
import BannerTopArchived from "./components/BannerTopArchived.vue";
import BannerTopPrLock from "./components/BannerTopPrLock.vue";
import BannerTopPrNeed from "./components/BannerTopPrNeed.vue";
import VSCodeSettingsLink from "./plugins/vuepress-plugin-sillot-inline/components/VSCodeSettingsLink.vue";
import GithubLabel from "./plugins/vuepress-plugin-sillot-inline/components/GithubLabel.vue";
import C from "./plugins/vuepress-plugin-sillot-inline/components/Const.vue";
import TestNaiveUi from "./components/TestNaiveUi.vue";
import TestRelationGraph from "./plugins/vuepress-plugin-sillot-vivime/components/TestRelationGraph.vue";
// 模板组件，一般不在 md 中使用，这里使用只是前期开发调试
import SSRComponent from "./components/templates/SSRComponent.vue";

import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { useAuthorStore } from "./plugins/vuepress-plugin-sillot-author/stores/author";

import "./styles/index.css";
import { useBioChainStore } from "./plugins/BiGraph/stores/bioChain";
import { TEMP_FILE_NAMES } from "./plugins/BiGraph/constants/index";
import { BioChainService } from "./plugins/BiGraph/services/bio-chain-service";

/**
 * vuepress 的 SSR 兼容参考 https://vitepress.dev/zh/guide/ssr-compat
 */
export default defineClientConfig({
  setup() {
  },
  layouts: {
    Layout,
    // 声明自定义组件，否则无法全局使用
    AuthorList,
    AuthorDetail,
  },
  async enhance({ app, router }) {
    // built-in components
    // app.component('RepoCard', RepoCard)
    // app.component('NpmBadge', NpmBadge)
    // app.component('NpmBadgeGroup', NpmBadgeGroup)
    // app.component('Swiper', Swiper) // you should install `swiper`
    // 注册Pinia状态管理
    const pinia = createPinia();

    //@ts-ignore
    // ref https://www.naiveui.com/zh-CN/dark/docs/vitepress
    if (import.meta.env.SSR) {
      const { collect } = setup(app);
      app.provide("css-render-collect", collect);
    } else {
      pinia.use(piniaPluginPersistedstate); // 注册插件
    }
    app.use(pinia);

    app.use(NaiveUI); // https://www.naiveui.com/zh-CN/dark/docs/import-on-demand

    // 注册全局组件，不在 md 中使用则不需注册
    app.component("BannerTopArchived", BannerTopArchived);
    app.component("BannerTopPrLock", BannerTopPrLock);
    app.component("BannerTopPrNeed", BannerTopPrNeed);
    app.component("VSCodeSettingsLink", VSCodeSettingsLink);
    app.component("GithubLabel", GithubLabel);
    app.component("C", C);
    app.component("TestNaiveUi", TestNaiveUi);
    app.component("TestRelationGraph", TestRelationGraph);
    app.component("SSRComponent", SSRComponent);

    // 初始化存储
    const authorStore = useAuthorStore();
    // @ts-ignore
    import("@temp/author-data.ts").then((module) => {
      console.log("@temp/author-data.ts ok", module.default);
      // 将数据存入Pinia存储
      authorStore.setAuthors(module.default);
    });

    router.addRoute({
      path: "/authors.html",
      component: AuthorList,
      name: "AuthorList",
    });

    router.addRoute({
      path: "/authors/:pathMatch(.*)*",
      component: AuthorDetail,
      name: "AuthorDetailCatchAll",
    });

    console.log("作者详情页路由已注册");
    // 路由守卫处理
    router.beforeEach((to) => {
      // 匹配作者详情页路由
      if (to.path.startsWith("/authors.html") || (to.path.startsWith("/authors/") && !to.path.endsWith("/"))) {
        // 自动添加尾部斜杠，确保与创建的页面路径一致 authors/a.thml -> authors/a/
        const normalizedPath = to.path.endsWith("/") ? to.path : to.path + "/";
        if (normalizedPath !== to.path) {
          return normalizedPath.replace('.html', '');
        }
      }
    });
    // 初始化存储
    const bioStore = useBioChainStore();
    // @ts-ignore
    import(`./.temp/${TEMP_FILE_NAMES.BIO_TS}.js`).then((module) => {
      console.log(`@temp/${TEMP_FILE_NAMES.BIO_TS}.js ok`, {
        页面数: module.pageCount,
        有效页面数: module.validPageCount,
      }, module.default);
      // 将数据存入Pinia存储
      bioStore.BiGraph = module.default;
      BioChainService.build(bioStore.BiGraph!.getAllPages());
    });
  },
});
