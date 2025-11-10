// services/frontmatter-service.ts - 前置数据处理服务

import type { Page, MapNodeLink, BioChainMapItem } from "../types";
import { bioChainMap } from "../models/bio-chain-map";
import { LocalMapBuilder } from "../builders/local-map-builder";
import { PathUtils } from "../utils/path-utils";

/**
 * 前置数据接口
 */
interface FrontmatterData {
  outlink: Array<{ title: string; link: string }>;
  backlink: Array<{ title: string; link: string }>;
  localMap?: MapNodeLink;
}

/**
 * 前置数据处理服务
 */
export class FrontmatterService {
  /**
   * 写入前置数据到页面
   */
  public static writeToFrontmatter(page: Page): void {
    const filePath = page.data.path //.filePathRelative;
    if (!filePath) return;

    const bioChain = bioChainMap.getItem(filePath);
    if (!bioChain) return;

    const processedData = this.processBioChainData(bioChain, filePath);
    page.data.bioChainData = processedData;
  }

  /**
   * 处理双链数据
   */
  private static processBioChainData(bioChain: BioChainMapItem, filePath: string): FrontmatterData {
    // 去重处理
    const uniqueOutlinks = PathUtils.uniqueArray(bioChain.outlink);
    const uniqueBacklinks = PathUtils.uniqueArray(bioChain.backlink);

    return {
      outlink: this.convertLinksToFrontmatterFormat(uniqueOutlinks),
      backlink: this.convertLinksToFrontmatterFormat(uniqueBacklinks),
      localMap: this.generateLocalMap(filePath),
    };
  }

  /**
   * 转换链接为前置数据格式
   */
  private static convertLinksToFrontmatterFormat(links: string[]): Array<{ title: string; link: string }> {
    return links.map((link) => {
      const bioItem = bioChainMap.getItem(link);
      return {
        title: bioItem?.title || '未知标题',
        link: PathUtils.mdToHtmlPath(link),
      };
    });
  }

  /**
   * 生成本地图谱
   */
  private static generateLocalMap(filePath: string): MapNodeLink | undefined {
    if (typeof filePath !== 'string') {
      console.warn('filePath is not a string, localMap will be undefined');
      return undefined;
    }

    try {
      return LocalMapBuilder.generate(filePath);
    } catch (error) {
      console.error('生成本地图谱时出错:', error);
      return undefined;
    }
  }
}