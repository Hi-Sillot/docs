/**
 * @fileOverview index.ts
 * @author erduotong
 */
// import { getDirname, path } from "vuepress/utils";
import {
    buildBioChainMap,
    // writeGlobalGraph,
    // writeTempGlobalGraph,
} from "./buildMapData";
// import {buildBioChainMap, writeGlobalGraph, writeTempGlobalGraph} from "./buildMapData2";
import type { App, Page, Plugin } from "vuepress/core";
import { BiGraphConfig } from "../types";

// const __dirname = getDirname(import.meta.url);
export let options: BiGraphConfig = {};
const graph_path = { target: "" };
const BiGraph = (config: BiGraphConfig = {}): Plugin => ({
    // return {
    name: "vuepress-plugin-bi-graph",
    async onInitialized(app) {
        // Object.assign(bioChainMap, {});
        // options = config
        // if (config.titleGetter) {
        //     buildBioChainMap(app.pages, config.titleGetter);
        // } else {
        //     buildBioChainMap(app.pages);
        // }

        // graph_path.target = writeTempGlobalGraph(app);

        // 写入TS格式的临时文件
        await app.writeTemp(
            "bio.ts",
            `
        const pages = ${JSON.stringify((app.pages))}
        export async function f(store, app) {
                store.initializeBioChain(pages);  // 初始化双链映射
                // pages.forEach(page => store.formatAndStorePageData(page));  // 处理页面数据
        }`,
            // export default ${JSON.stringify(writeGlobalGraph(app))};`
        );
    },
    onGenerated: async (app: App) => {
        //
    },
    define: {
        __RELATIONAL_GRAPH_FOLD_EMPTY_GRAPH: config.foldEmptyGraph || false,
        __RELATIONAL_GRAPH_LOCAL_GRAPH_DEEP: config.localGraphDeep || 5,
        __RELATIONAL_GRAPH_MAX_WIDTH: config.graphMaxWidth || Infinity,
        __RELATIONAL_GRAPH_HEIGHT: config.graphHeight || 300,
        __RELATIONAL_GRAPH_ENABLE_GLOBAL_GRAPH:
            config.enableGlobalGraph !== undefined
                ? config.enableGlobalGraph
                : true,
        __RELATIONAL_GRAPH_ENABLE_LOCAL_GRAPH:
            config.enableLocalGraph !== undefined
                ? config.enableLocalGraph
                : true,
        // __RELATIONAL_GRAPH_GRAPH_PATH: graph_path,
    },
    // };
});

export default BiGraph;
