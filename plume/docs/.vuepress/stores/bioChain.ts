import { defineStore } from "pinia";

// import { fs, path } from "vuepress/utils";
// import { App } from "vuepress/core";
// import { graphDataName } from "../plugins/BiGraph/client/useGlobalGraph";
import type {
  BiGraphConfig,
  BioChainMapItem,
  LocalMapItem,
  MapNodeLink,
  Page,
  QueueItem,
  TitleGetter,
} from "../plugins/BiGraph/types/index";
import { BioChainService } from "../plugins/BiGraph/services/bio-chain-service";
let options: BiGraphConfig = {};

export const useBioChainStore = defineStore("bioChain", {
  state: () => ({
    showGlobalGraph: false,
    // 双链核心映射表（原全局变量 bioChainMap 迁移至此）
    bioChainMap: {} as Record<string, BioChainMapItem>,
    // 页面级数据存储（包含链接列表和本地图谱）
    pageData: {} as Record<string, {
      outlink: { title: string; link: string }[];
      backlink: { title: string; link: string }[];
      localMap: MapNodeLink | undefined;
    }>,
  }),

  getters: {
    // 获取指定页面数据
    getPageData: (state) => (filePath: string) => state.pageData[filePath],
    // 获取双链映射项
    getBioChainItem: (state) => (filePath: string) =>
      state.bioChainMap[filePath],
  },

  actions: {
    /**
     * 初始化双链映射核心逻辑（整合原 buildBioChainMap）
     * @param pages 页面数组
     * @param titleGetter 标题获取函数（可选）
     */
    initializeBioChain(pages: Page[], titleGetter: TitleGetter = (page) => {
      return page.title?.trim() || page.permalink || "";
    }) {
      BioChainService.build(pages)
    },

    /**
     * 生成本地图谱（整合两个文件的 generateLocalMap 实现）
     * @param root 根路径
     * @param maxDeep 最大遍历深度（默认5）
     * @returns 本地图谱数据（node-link格式）
     */
    generateLocalMap(
      root: string,
      maxDeep = options.localGraphDeep || 5,
    ): MapNodeLink {
      const localMap: Record<string, LocalMapItem> = {};
      const queue: QueueItem[] = [{ permalink: root, depth: 0 }];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const { permalink, depth } = queue.shift()!;
        if (depth > maxDeep || visited.has(permalink)) continue;

        visited.add(permalink);
        const currentItem = this.getBioChainItem(permalink)!;

        localMap[ppermalinkath] = {
          title: currentItem.title,
          filePathRelative: permalink,
          htmlFilePathRelative: currentItem.htmlFilePathRelative,
          permalink: currentItem.permalink,
          outlink: [],
          backlink: [],
        };

        // 处理正向链接
        currentItem.outlink.forEach((link) => {
          if (!visited.has(link) && depth + 1 <= maxDeep) {
            queue.push({ permalink: link, depth: depth + 1 });
            localMap[permalink].outlink.push(link);
          }
        });

        // 处理反向链接
        currentItem.backlink.forEach((link) => {
          if (!visited.has(link) && depth + 1 <= maxDeep) {
            queue.push({ permalink: link, depth: depth + 1 });
            localMap[permalink].backlink.push(link);
          }
        });
      }

      // 转换为 node-link 格式
      const nodeLink: MapNodeLink = { nodes: [], links: [] };
      Object.keys(localMap).forEach((key) => {
        nodeLink.nodes.push({
          id: key,
          value: localMap[key],
          linkCount: localMap[key].outlink.length +
            localMap[key].backlink.length,
        });

        // 添加正向链接关系
        localMap[key].outlink.forEach((link) => {
          nodeLink.links.push({ source: key, target: link });
        });

        // 添加反向链接关系
        localMap[key].backlink.forEach((link) => {
          nodeLink.links.push({ source: link, target: key });
        });
      });

      return nodeLink;
    },

    /**
     * 生成全局图谱（整合原 buildGlobalMap）
     * @returns 全局图谱数据（node-link格式）
     */
    getGlobalMap(): MapNodeLink {
      const globalMap: MapNodeLink = { nodes: [], links: [] };

      Object.keys(this.bioChainMap).forEach((path) => {
        const item = this.bioChainMap[path];

        // 添加节点
        globalMap.nodes.push({
          id: path,
          value: { ...item },
          linkCount: item.outlink.length + item.backlink.length,
        });

        // 添加反向链接（被引用关系）
        item.backlink.forEach((link) => {
          globalMap.links.push({ source: link, target: path });
        });

        // 添加正向链接（引用关系）
        item.outlink.forEach((link) => {
          globalMap.links.push({ source: path, target: link });
        });
      });

      return globalMap;
    },
  },
});
export default useBioChainStore;
