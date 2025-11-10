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
// import type { BiGraphConfig, Plugin } from "../types";
import { ConfigManager } from "./config-manager";
import { TempFileWriter } from "./temp-file-writer";
import { VariableInjector } from "./variable-injector";

// const __dirname = getDirname(import.meta.url);
export let options: BiGraphConfig = {};
const graph_path = { target: "" };

/**
 * 双链图谱插件
 */
const BiGraph = (config: BiGraphConfig = {}): Plugin => ({
    // return {
    name: "vuepress-plugin-bi-graph",

    /**
     * 应用初始化完成时的钩子
     */
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
        await TempFileWriter.writeBioTempFile(app);
        // await app.writeTemp(
        //     "bio.ts",
        //     `
        // const pages = ${JSON.stringify((app.pages))}
        // export async function f(store, app) {
        //         store.initializeBioChain(pages);  // 初始化双链映射
        //         // pages.forEach(page => store.formatAndStorePageData(page));  // 处理页面数据
        // }`,
        //     // export default ${JSON.stringify(writeGlobalGraph(app))};`
        // );
    },
  
    /**
     * 站点生成完成时的钩子
     */
    onGenerated: async (app: App) => {
        //
    },
    /**
     * 定义客户端变量
     */
    // define: VariableInjector.getInjectedVariables(),
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

// import type { BiGraphConfig, Plugin } from "../types";
// import { ConfigManager } from "./config-manager";
// import { TempFileWriter } from "./temp-file-writer";
// import { VariableInjector } from "./variable-injector";

// /**
//  * 双链图谱插件
//  */
// const BiGraph = (config: BiGraphConfig = {}): Plugin => {
//   const configManager = ConfigManager.getInstance();
//   configManager.initialize(config);

//   return {
//     name: "vuepress-plugin-bi-graph",
    
//     /**
//      * 应用初始化完成时的钩子
//      */
//     async onInitialized(app) {
//       await TempFileWriter.writeBioTempFile(app);
//     },

//     /**
//      * 站点生成完成时的钩子
//      */
//     async onGenerated(app) {
//       // 可以在这里添加生成后的处理逻辑
//     },

//     /**
//      * 定义客户端变量
//      */
//     define: VariableInjector.getInjectedVariables(),
//   };
// };

// export default BiGraph;
// export { BiGraphConfig } from "../types";