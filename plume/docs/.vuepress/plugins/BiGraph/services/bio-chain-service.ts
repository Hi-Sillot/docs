// services/bio-chain-service.ts - 双链构建服务

import type { Page, TitleGetter } from "../types";
import { bioChainMap } from "../models/bio-chain-map";
import { PathUtils } from "../utils/path-utils";

/**
 * 双链构建服务
 */
export class BioChainService {
  /**
   * 默认标题获取器
   */
  private static defaultTitleGetter: TitleGetter = (page) => {
    if (!page.title || page.title.trim() === "") {
      return page.filePathRelative ?? '未命名';
    }
    return page.title;
  };

  /**
   * 构建双链映射
   */
  public static build(pages: Page[], titleGetter?: TitleGetter): void {
    const getter = titleGetter || this.defaultTitleGetter;
    const validPages = this.filterValidPages(pages);

    this.buildBioChainMap(validPages, getter);
    this.processPageLinks(validPages);
  }

  /**
   * 过滤有效页面
   */
  private static filterValidPages(pages: Page[]): Page[] {
    return pages.filter(page => typeof page.filePathRelative === 'string');
  }

  /**
   * 构建双链映射
   */
  private static buildBioChainMap(pages: Page[], titleGetter: TitleGetter): void {
    pages.forEach(page => {
      const filePathRelative = page.filePathRelative!;
      bioChainMap.setItem(filePathRelative, {
        title: titleGetter(page),
        filePathRelative: page.filePathRelative,
        htmlFilePathRelative: page.htmlFilePathRelative,
        permalink: page.permalink,
        outlink: [],
        backlink: [],
      });
    });
  }

  /**
   * 处理页面链接
   */
  private static processPageLinks(pages: Page[]): void {
    pages.forEach(page => {
      const permalink = page.permalink!;
      const links = this.extractValidLinks(page);

      links.forEach(link => {
        if (bioChainMap.hasItem(link)) {
          this.updateLinkRelationships(permalink, link);
        }
      });
    });
  }

  /**
   * 提取有效链接
   */
  private static extractValidLinks(page: Page): string[] {
    return page.links
      .map(link => PathUtils.decodeAndNormalizePath(link.relative))
      .filter(link => link); // 过滤空链接
  }

  /**
   * 更新链接关系
   */
  private static updateLinkRelationships(sourcePath: string, targetPath: string): void {
    const sourceItem = bioChainMap.getItem(sourcePath);
    const targetItem = bioChainMap.getItem(targetPath);

    if (sourceItem && targetItem) {
      // 添加出链和回链
      if (!sourceItem.outlink.includes(targetPath)) {
        sourceItem.outlink.push(targetPath);
      }
      if (!targetItem.backlink.includes(sourcePath)) {
        targetItem.backlink.push(sourcePath);
      }
    }
  }
}