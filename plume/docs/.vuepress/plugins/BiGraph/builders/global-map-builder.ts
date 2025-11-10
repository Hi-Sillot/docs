// builders/global-map-builder.ts - 全局图谱构建器

import type { MapNodeLink } from "../types";
import { bioChainMap } from "../models/bio-chain-map";

/**
 * 全局图谱构建器
 */
export class GlobalMapBuilder {
  /**
   * 构建全局图谱
   */
  public static build(): MapNodeLink {
    const graph: MapNodeLink = {
      nodes: [],
      links: [],
    };

    const keys = bioChainMap.getKeys();
    
    keys.forEach((path) => {
      this.addNodeToGraph(graph, path);
      this.addLinksToGraph(graph, path);
    });

    return graph;
  }

  /**
   * 添加节点到图谱
   */
  private static addNodeToGraph(graph: MapNodeLink, path: string): void {
    const bioItem = bioChainMap.getItem(path);
    if (!bioItem) return;

    graph.nodes.push({
      id: path,
      value: {
        title: bioItem.title,
        filePathRelative: path,
        htmlFilePathRelative: bioItem.htmlFilePathRelative,
        permalink: bioItem.permalink,
        outlink: bioItem.outlink,
        backlink: bioItem.backlink,
      },
      linkCount: 0
    });
  }

  /**
   * 添加链接到图谱
   */
  private static addLinksToGraph(graph: MapNodeLink, path: string): void {
    const bioItem = bioChainMap.getItem(path);
    if (!bioItem) return;

    // 添加回链
    bioItem.backlink.forEach((link) => {
      graph.links.push({ source: link, target: path });
    });

    // 添加出链
    bioItem.outlink.forEach((link) => {
      graph.links.push({ source: path, target: link });
    });
  }
}