// services/bio-chain-service.ts - 清理版本
import { useBioChainStore } from "../stores/bioChain";
import type { Page } from "../types";
// import { bioChainMap } from "../models/bio-chain-map";
import { debug } from "../utils/debug";
import type { MarkdownLink } from "vuepress/markdown";

const TAG = "BioChainService";

/**
 * 双链构建服务 - 简化版本
 */
export class BioChainService {
  /**
   * 构建双链映射 - 简化逻辑
   */
  public static async build(pages: Page[], titleGetter?: (page: Page) => string): Promise<void> {
    debug.log(TAG, '开始构建双链映射', { 
      总页面数: pages.length,
      有permalink的页面数: pages.filter(p => p.permalink).length
    });

    try {
      const validPages = this.filterValidPages(pages);
      debug.log(TAG, '有效页面数', validPages.length);

      this.buildBioChainMap(validPages, titleGetter);
      this.processPageLinks(validPages);

      // 输出统计信息
      this.printStatistics();
      
      debug.log(TAG, '双链映射构建完成');
    } catch (error) {
      debug.error(TAG, '构建双链映射失败', error);
      throw error;
    }
  }

  /**
   * 过滤有效页面
   */
  private static filterValidPages(pages: Page[]): Page[] {
    const validPages = pages.filter(page => 
      page.permalink && typeof page.permalink === 'string'
    );
    
    debug.log(TAG, '页面过滤结果', {
      总页面: pages.length,
      有效页面: validPages.length,
      无效页面: pages.length - validPages.length
    });

    return validPages;
  }

  /**
   * 构建双链映射
   */
  private static buildBioChainMap(pages: Page[], titleGetter?: (page: Page) => string): void {
    debug.log(TAG, '开始构建生物链映射');
const bioStore = useBioChainStore();

    pages.forEach((page, index) => {
      const title = titleGetter 
        ? titleGetter(page) 
        : page.title || page.filePathRelative || '未命名';

        bioStore.bioChainMap[page.permalink!] = {
        title,
        filePathRelative: page.filePathRelative,
        htmlFilePathRelative: page.htmlFilePathRelative,
        permalink: page.permalink!,
        outlink: [],
        backlink: [],
      }

      if (index < 3) {
        debug.log(TAG, `添加页面 ${index + 1}/${pages.length}`, {
          permalink: page.permalink,
          title: title,
          linksCount: page.links?.length || 0
        });
      }
    });

  }

  /**
   * 处理页面链接
   */
  private static processPageLinks(pages: Page[]): void {
    debug.log(TAG, '开始处理页面链接');

    let totalLinks = 0;
    let validLinks = 0;

    pages.forEach((page, pageIndex) => {
      const permalink = page.permalink!;
      const links = this.extractValidLinks(page);
      
      totalLinks += page.links?.length || 0;
      validLinks += links.length;

      links.forEach(link => {
        this.updateLinkRelationships(permalink, link.relative);
      });
    });

    debug.log(TAG, '页面链接处理完成', {
      总链接数: totalLinks,
      有效链接数: validLinks
    });
  }

  /**
   * 提取有效链接
   */
  private static extractValidLinks(page: Page): MarkdownLink[] {
    return (page.links || []).filter(link => 
      link && link.relative && typeof link.relative === 'string'
    );
  }

  /**
   * 更新链接关系
   */
  private static updateLinkRelationships(permalink: string, targetLink: string): void {
const bioStore = useBioChainStore();
    try {
      // 确保源节点存在
      if (!bioStore.bioChainMap[permalink]) {
        debug.warn(TAG, `源节点不存在: ${permalink}`);
        return;
      }

      // 确保目标节点存在
      if (!bioStore.bioChainMap[targetLink]) {
        debug.log(TAG, `创建缺失的目标节点: ${targetLink}`);
        bioStore.bioChainMap[targetLink] = {
          title: targetLink,
          filePathRelative: null,
          htmlFilePathRelative: null,
          permalink: targetLink,
          outlink: [],
          backlink: []
        };
      }

      // 更新正向链接
      const sourceItem = bioStore.bioChainMap[permalink]!;
      if (!sourceItem.outlink.includes(targetLink)) {
        sourceItem.outlink.push(targetLink);
      }

      // 更新反向链接
      const targetItem = bioStore.bioChainMap[targetLink]!;
      if (!targetItem.backlink.includes(permalink)) {
        targetItem.backlink.push(permalink);
      }

    } catch (error) {
      debug.error(TAG, `更新链接关系失败: ${permalink} -> ${targetLink}`, error);
    }
  }

  /**
   * 打印统计信息
   */
  private static printStatistics(): void {
const bioStore = useBioChainStore();
    const map = bioStore.bioChainMap;
    const keys = Object.keys(map);
    
    let totalOutlinks = 0;
    let totalBacklinks = 0;
    let nodesWithLinks = 0;

    keys.forEach(key => {
      const item = map[key];
      totalOutlinks += item.outlink.length;
      totalBacklinks += item.backlink.length;
      if (item.outlink.length > 0 || item.backlink.length > 0) {
        nodesWithLinks++;
      }
    });

    debug.log(TAG, '双链构建统计', {
      总节点数: keys.length,
      有链接的节点数: nodesWithLinks,
      孤立节点数: keys.length - nodesWithLinks,
      总出链数: totalOutlinks,
      总入链数: totalBacklinks
    });
  }

}