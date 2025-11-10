// builders/global-map-builder.ts

import type { MapNodeLink, Node } from "../types";
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

    // 使用 Object.keys 而不是 getKeys()，因为 bioChainMap 是普通对象
    const keys = Object.keys(bioChainMap);
    
    // 先添加所有节点
    keys.forEach((path) => {
      this.addNodeToGraph(graph, path);
    });

    // 然后添加所有链接，避免重复
    keys.forEach((path) => {
      this.addLinksToGraph(graph, path);
    });

    // 更新节点的连接计数
    this.updateLinkCounts(graph);

    return graph;
  }

  /**
   * 添加节点到图谱
   */
  private static addNodeToGraph(graph: MapNodeLink, path: string): void {
    const bioItem = bioChainMap[path]; // 直接通过属性访问
    if (!bioItem) {
      console.warn(`未找到路径对应的生物链项: ${path}`);
      return;
    }

    const node: Node = {
      id: path,
      value: {
        title: bioItem.title,
        filePathRelative: bioItem.filePathRelative,
        htmlFilePathRelative: bioItem.htmlFilePathRelative,
        permalink: bioItem.permalink,
        outlink: bioItem.outlink || [],
        backlink: bioItem.backlink || [],
      },
      linkCount: 0,
      isCurrent: false,
      isIsolated: false
    };

    graph.nodes.push(node);
  }

  /**
   * 添加链接到图谱
   */
  private static addLinksToGraph(graph: MapNodeLink, path: string): void {
    const bioItem = bioChainMap[path];
    if (!bioItem) return;

    const linkSet = new Set<string>(); // 用于去重

    // 添加入链（其他页面指向当前页面）
    (bioItem.backlink || []).forEach((sourcePath) => {
      const linkKey = `${sourcePath}->${path}`;
      if (!linkSet.has(linkKey)) {
        linkSet.add(linkKey);
        graph.links.push({ 
          source: sourcePath, 
          target: path 
        });
      }
    });

    // 添加出链（当前页面指向其他页面）
    (bioItem.outlink || []).forEach((targetPath) => {
      const linkKey = `${path}->${targetPath}`;
      if (!linkSet.has(linkKey)) {
        linkSet.add(linkKey);
        graph.links.push({ 
          source: path, 
          target: targetPath 
        });
      }
    });
  }

  /**
   * 更新节点的连接计数
   */
  private static updateLinkCounts(graph: MapNodeLink): void {
    graph.nodes.forEach((node) => {
      node.linkCount = graph.links.filter(link => 
        link.source === node.id || link.target === node.id
      ).length;
      node.isIsolated = node.linkCount === 0;
    });
  }
}