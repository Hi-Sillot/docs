// builders/local-map-builder.ts - 本地图谱构建器

import type { LocalMapItem, MapNodeLink, QueueItem } from "../types";
import { bioChainMap } from "../models/bio-chain-map";
import { optionsManager } from "../config/options";

/**
 * 本地图谱构建器
 */
export class LocalMapBuilder {
  /**
   * 生成本地图谱
   */
  public static generate(root: string): MapNodeLink {
    const maxDeep = optionsManager.localGraphDeep;
    const localMap: Record<string, LocalMapItem> = {};
    const queue: QueueItem[] = [{ path: root, depth: 0 }];
    const visited = new Set<string>();

    this.buildLocalMap(localMap, queue, visited, maxDeep);
    return this.convertToNodeLinkFormat(localMap);
  }

  /**
   * 构建本地映射
   */
  private static buildLocalMap(
    localMap: Record<string, LocalMapItem>,
    queue: QueueItem[],
    visited: Set<string>,
    maxDeep: number
  ): void {
    while (queue.length > 0) {
      const { path, depth } = queue.shift()!;

      if (depth > maxDeep || visited.has(path)) {
        continue;
      }

      visited.add(path);
      this.addNodeToLocalMap(localMap, path);

      const bioItem = bioChainMap.getItem(path);
      if (!bioItem) continue;

      this.processLinks(localMap, queue, visited, path, bioItem.outlink, depth + 1, maxDeep, 'outlink');
      this.processLinks(localMap, queue, visited, path, bioItem.backlink, depth + 1, maxDeep, 'backlink');
    }
  }

  /**
   * 添加节点到本地映射
   */
  private static addNodeToLocalMap(localMap: Record<string, LocalMapItem>, path: string): void {
    const bioItem = bioChainMap.getItem(path);
    if (!bioItem) return;

    localMap[path] = {
      title: bioItem.title,
      filePathRelative: path,
      htmlFilePathRelative: bioItem.htmlFilePathRelative,
      permalink: bioItem.permalink,
      outlink: [],
      backlink: [],
    };
  }

  /**
   * 处理链接
   */
  private static processLinks(
    localMap: Record<string, LocalMapItem>,
    queue: QueueItem[],
    visited: Set<string>,
    currentPath: string,
    links: string[],
    nextDepth: number,
    maxDeep: number,
    linkType: 'outlink' | 'backlink'
  ): void {
    links.forEach((link) => {
      if (!visited.has(link) && nextDepth <= maxDeep) {
        queue.push({ path: link, depth: nextDepth });
        localMap[currentPath]?.[linkType].push(link);
      }
    });
  }

  /**
   * 转换为节点-链接格式
   */
  private static convertToNodeLinkFormat(localMap: Record<string, LocalMapItem>): MapNodeLink {
    const nodeLink: MapNodeLink = {
      nodes: [],
      links: [],
    };

    Object.keys(localMap).forEach((key) => {
      const item = localMap[key];
      nodeLink.nodes.push({
        id: key,
        value: { ...item },
        linkCount: 0
      });

      // 处理出链
      item.outlink.forEach((link) => {
        nodeLink.links.push({ source: key, target: link });
      });

      // 处理回链
      item.backlink.forEach((link) => {
        nodeLink.links.push({ source: link, target: key });
      });
    });

    return nodeLink;
  }
}