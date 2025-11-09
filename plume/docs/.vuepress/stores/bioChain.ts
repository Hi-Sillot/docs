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
      return page.title?.trim() || page.filePathRelative || "未命名";
    }) {
      // 步骤1：过滤无效页面并初始化基础映射
      const validPages = pages.filter((page) =>
        typeof page.filePathRelative === "string"
      );
      validPages.forEach((page) => {
        const filePath = page.filePathRelative!;
        this.bioChainMap[filePath] = {
          title: titleGetter(page),
          filePathRelative: filePath,
          htmlFilePathRelative: page.htmlFilePathRelative,
          permalink: page.permalink,
          outlink: [],
          backlink: [],
        };
      });

      // 步骤2：构建双向链接关系
      validPages.forEach((page) => {
        const links = page.links.map((link) =>
          decodeURIComponent(link.relative)
        );

        links.forEach((link) => {
          if (this.bioChainMap[link]) {
            // 更新反向链接（被引用页面的 backlink）
            this.bioChainMap[link].backlink.push(page.filePathRelative);
            // 更新正向链接（当前页面的 outlink）
            if (page.filePathRelative)
            this.bioChainMap[page.filePathRelative].outlink.push(link);
          }
        });
      });
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
      const queue: QueueItem[] = [{ path: root, depth: 0 }];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const { path, depth } = queue.shift()!;
        if (depth > maxDeep || visited.has(path)) continue;

        visited.add(path);
        const currentItem = this.getBioChainItem(path)!;

        localMap[path] = {
          title: currentItem.title,
          path: path,
          htmlFilePathRelative: currentItem.htmlFilePathRelative,
          permalink: currentItem.permalink,
          outlink: [],
          backlink: [],
        };

        // 处理正向链接
        currentItem.outlink.forEach((link) => {
          if (!visited.has(link) && depth + 1 <= maxDeep) {
            queue.push({ path: link, depth: depth + 1 });
            localMap[path].outlink.push(link);
          }
        });

        // 处理反向链接
        currentItem.backlink.forEach((link) => {
          if (!visited.has(link) && depth + 1 <= maxDeep) {
            queue.push({ path: link, depth: depth + 1 });
            localMap[path].backlink.push(link);
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

    /**
     * 格式化链接并写入页面数据（整合原 write_to_frontmatter 核心逻辑）
     * @param page 目标页面
     */
    // formatAndStorePageData(page: Page) {
    //   const filePath = page.filePathRelative;
    //   if (!filePath || !this.bioChainMap[filePath]) return;

    //   const chainItem = this.bioChainMap[filePath];

    //   // 链接去重
    //   chainItem.outlink = [...new Set(chainItem.outlink)];
    //   chainItem.backlink = [...new Set(chainItem.backlink)];

    //   // 格式化正向链接（.md -> .html）
    //   const formattedOutlinks = chainItem.outlink.map((link) => {
    //     const parsed = path.parse(link);
    //     const htmlLink = parsed.ext === ".md"
    //       ? path.format({ ...parsed, ext: ".html" })
    //       : link;
    //     return {
    //       title: this.bioChainMap[link]?.title || "未命名",
    //       link: htmlLink,
    //     };
    //   });

    //   // 格式化反向链接（.md -> .html）
    //   const formattedBacklinks = chainItem.backlink.map((link) => {
    //     const parsed = path.parse(link);
    //     const htmlLink = parsed.ext === ".md"
    //       ? path.format({ ...parsed, ext: ".html" })
    //       : link;
    //     return {
    //       title: this.bioChainMap[link]?.title || "未命名",
    //       link: htmlLink,
    //     };
    //   });

    //   // 生成并存储页面数据
    //   this.pageData[filePath] = {
    //     outlink: formattedOutlinks,
    //     backlink: formattedBacklinks,
    //     localMap: this.generateLocalMap(filePath),
    //   };
    // },
  },
});
export default useBioChainStore;

// ------------------------------
// 以下为文件操作辅助函数（独立于Store）
// ------------------------------

// /**
//  * 写入全局图谱文件
//  * @param app VuePress应用实例
//  */
// export async function writeGlobalGraph(app: App): Promise<void> {
//   const store = useBioChainStore();
//   const globalMap = store.getGlobalMap();
//   const location = app.dir.dest(graphDataName);

//   await fs.ensureDir(path.dirname(location));
//   await fs.writeFile(location, JSON.stringify(globalMap), "utf-8");
// }

// /**
//  * 写入临时全局图谱文件
//  * @param app VuePress应用实例
//  * @returns 临时文件相对路径
//  */
// export function writeTempGlobalGraph(app: App): string {
//   const store = useBioChainStore();
//   const globalMap = store.getGlobalMap();
//   const location = app.dir.temp(graphDataName);

//   fs.ensureDirSync(path.dirname(location));
//   fs.writeFileSync(location, JSON.stringify(globalMap), "utf-8");

//   return path.relative(app.dir.source(), location);
// }
