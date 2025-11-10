// builders/local-map-builder.ts

import type { LocalMapItem, MapNodeLink, QueueItem, Node, BioChainMapItem } from "../types";
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
    // 检查根路径是否存在
    if (!bioChainMap[root]) {
      console.warn(`根路径不存在于映射中: ${root}`);
      return { nodes: [], links: [] };
    }

    const maxDeep = optionsManager.localGraphDeep || 3;
    const localMap: Record<string, LocalMapItem> = {};
    const queue: QueueItem[] = [{ permalink: root, depth: 0 }];
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
      const { permalink, depth } = queue.shift()!;

      if (depth > maxDeep || visited.has(permalink)) {
        continue;
      }

      visited.add(permalink);
      
      // 添加当前节点到本地映射
      if (!this.addNodeToLocalMap(localMap, permalink)) {
        continue; // 如果节点添加失败，跳过处理其链接
      }

      const bioItem = bioChainMap[permalink];
      if (!bioItem) continue;

      // 处理出链
      this.processLinks(localMap, queue, visited, permalink, bioItem.outlink || [], depth, maxDeep, 'outlink');
      
      // 处理入链
      this.processLinks(localMap, queue, visited, permalink, bioItem.backlink || [], depth, maxDeep, 'backlink');
    }
  }

  /**
   * 添加节点到本地映射
   * @returns 是否成功添加
   */
  private static addNodeToLocalMap(localMap: Record<string, LocalMapItem>, permalink: string): boolean {
    const bioItem: BioChainMapItem = bioChainMap[permalink];
    if (!bioItem) {
      console.warn(`无法找到路径对应的生物链项: ${permalink}`);
      return false;
    }

    localMap[permalink] = {
      title: bioItem.title,
      filePathRelative: bioItem.filePathRelative,
      htmlFilePathRelative: bioItem.htmlFilePathRelative,
      permalink: bioItem.permalink,
      outlink: bioItem.outlink,
      backlink: bioItem.backlink,
    };

    return true;
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
    currentDepth: number,
    maxDeep: number,
    linkType: 'outlink' | 'backlink'
  ): void {
    const nextDepth = currentDepth + 1;
    
    links.forEach((link) => {
      // 检查链接目标是否存在
      if (!bioChainMap[link]) {
        console.warn(`链接目标不存在: ${link} (来自 ${currentPath})`);
        return;
      }

      // 将链接添加到当前节点的对应链接数组中
      if (localMap[currentPath]) {
        localMap[currentPath][linkType].push(link);
      }

      // 如果目标节点未被访问且未超过最大深度，加入队列
      if (!visited.has(link) && nextDepth <= maxDeep) {
        queue.push({ permalink: link, depth: nextDepth });
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

    const linkSet = new Set<string>(); // 用于链接去重

    Object.keys(localMap).forEach((key) => {
      const item = localMap[key];
      
      // 创建节点
      const node: Node = {
        id: key,
        value: { 
          title: item.title,
          filePathRelative: item.filePathRelative,
          htmlFilePathRelative: item.htmlFilePathRelative,
          permalink: item.permalink,
          outlink: item.outlink,
          backlink: item.backlink
        },
        linkCount: 0,
        isCurrent: false, // 将在外部设置
        isIsolated: false
      };
      
      nodeLink.nodes.push(node);

      // 处理出链
      item.outlink.forEach((target) => {
        const linkKey = `${key}->${target}`;
        if (!linkSet.has(linkKey) && localMap[target]) { // 确保目标节点在本地图中
          linkSet.add(linkKey);
          nodeLink.links.push({ source: key, target: target });
        }
      });

      // 处理入链（注意方向）
      item.backlink.forEach((source) => {
        const linkKey = `${source}->${key}`;
        if (!linkSet.has(linkKey) && localMap[source]) { // 确保源节点在本地图中
          linkSet.add(linkKey);
          nodeLink.links.push({ source: source, target: key });
        }
      });
    });

    // 更新连接计数
    nodeLink.nodes.forEach((node) => {
      node.linkCount = nodeLink.links.filter(link => 
        link.source === node.id || link.target === node.id
      ).length;
      node.isIsolated = node.linkCount === 0;
    });

    return nodeLink;
  }

  /**
   * 设置当前节点标记
   */
  public static setCurrentNode(graph: MapNodeLink, currentPath: string): void {
    graph.nodes.forEach(node => {
      node.isCurrent = node.id === currentPath;
    });
  }
}