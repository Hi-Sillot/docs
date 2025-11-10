// services/bio-chain-service.ts - 双链构建服务
// 构建时调用，前端请勿调用

import type { Page, PageLinks, TitleGetter } from "../types";
import { bioChainMap } from "../models/bio-chain-map";
import { PathUtils } from "../utils/path-utils";
import type { MarkdownLink } from "vuepress/markdown";

/**
 * 双链构建服务
 */
export class BioChainService {
  private static TAG = "BioChainService"
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
    console.log(bioChainMap)
  }

  /**
   * 过滤有效页面
   */
  private static filterValidPages(pages: Page[]): Page[] {
    return pages.filter(page => typeof page.permalink === 'string');
  }

  /**
   * 构建双链映射
   */
  private static buildBioChainMap(validPages: Page[], titleGetter: TitleGetter | undefined = undefined): void {
    validPages.forEach(page => {
      if (page.links.length>0) {console.warn(this.TAG,page.permalink, page.links)} //debug
      bioChainMap.setItem(page.permalink!, {
        title: titleGetter ? titleGetter(page) : page.title,
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
  private static processPageLinks(validPages: Page[]): void {
    validPages.forEach(page => {
      const permalink = page.permalink!;
      const links = this.extractValidLinks(page);

      links.forEach(link => {
          this.updateLinkRelationships(permalink, link);
      });
    });
  }

  /**
   * 提取有效链接
   */
  private static extractValidLinks(page: Page): MarkdownLink[] {
    return page.links.filter(link => link); // 过滤空链接
  }

  /**
   * 更新链接关系
   */
  private static updateLinkRelationships(permalink: string, links: MarkdownLink): void {
        // bioChainMap[permalink].outlink.push(links); // 更新正向链接（当前页面的 outlink）
        // bioChainMap[links.relative].backlink.push(permalink); // 更新反向链接（被引用页面的 backlink）

        // 确保 bioChainMap[permalink] 存在
    if (!bioChainMap[permalink]) {
        bioChainMap[permalink] = {
            title: '',
            filePathRelative: null,
            htmlFilePathRelative: null,
            permalink: permalink,
            outlink: [],
            backlink: []
        };
    }
    
    // 确保 bioChainMap[links.relative] 存在
    if (!bioChainMap[links.relative]) {
        bioChainMap[links.relative] = {
            title: '',
            filePathRelative: null,
            htmlFilePathRelative: null,
            permalink: links.relative,
            outlink: [],
            backlink: []
        };
    }
    
    // 更新正向链接（当前页面的 outlink）
    bioChainMap[permalink].outlink.push(links.relative);
    // 更新反向链接（被引用页面的 backlink）
    bioChainMap[links.relative].backlink.push(permalink);
  }
}