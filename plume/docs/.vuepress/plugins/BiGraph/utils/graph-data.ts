// utils/graph-data.ts

import type { MapNodeLink, Node, MapLink } from "../types";

// 日志计数器
let logCounter = 0;
function log(step: string, data?: any) {
  console.log(`${++logCounter}. [graph-data] ${step}`, data ? data : '');
}

/**
 * 检查是否在浏览器环境中运行
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * 获取图谱数据
 * 从全局的 bioChainMap 中获取实际的图谱数据
 * 在 mounted 钩子中调用， `const graphData = await getGraphData(this.$route.path);`
 */
export async function getGraphData(currentPath: string): Promise<MapNodeLink> {
  log("开始获取图谱数据", { 当前路径: currentPath });
  
  // 如果不是浏览器环境，返回空数据（适用于构建时）
  if (!isBrowser()) {
    log("非浏览器环境，返回空数据");
    return { nodes: [], links: [] };
  }
  
  return new Promise((resolve, reject) => {
    try {
      // 使用微任务延迟以确保全局变量已加载
      Promise.resolve().then(() => {
        try {
          // 从全局变量获取实际的图谱数据
          // @ts-ignore
          const globalBioChainMap = window.__BIO_CHAIN_MAP__;
          
          if (!globalBioChainMap) {
            log("未找到全局双链映射表，返回空数据");
            resolve({ nodes: [], links: [] });
            return;
          }

          const graphData = generateGraphDataFromBioChainMap(currentPath, globalBioChainMap);
          log("图谱数据获取成功", { 
            节点数: graphData.nodes.length, 
            链接数: graphData.links.length 
          });
          resolve(graphData);
        } catch (error) {
          log("生成图谱数据时出错", error);
          reject(error);
        }
      });
    } catch (error) {
      log("获取图谱数据时出错", error);
      reject(error);
    }
  });
}

/**
 * 从 bioChainMap 生成实际的图谱数据
 */
function generateGraphDataFromBioChainMap(currentPath: string, bioChainMap: any): MapNodeLink {
  log("从双链映射表生成图谱数据", { 当前路径: currentPath });
  
  const nodes: Node[] = [];
  const links: MapLink[] = [];
  const visited = new Set<string>();

  // 使用 BFS 遍历相关节点
  const queue: Array<{path: string, depth: number}> = [{ path: currentPath, depth: 0 }];
  const maxDepth = 3; // 最大遍历深度

  while (queue.length > 0) {
    const { path, depth } = queue.shift()!;
    
    if (depth > maxDepth || visited.has(path)) {
      continue;
    }
    
    visited.add(path);
    
    const pageData = bioChainMap[path];
    if (!pageData) {
      log("未找到页面数据", { 路径: path });
      continue;
    }

    // 创建当前节点
    const currentNode: Node = {
      id: path,
      value: {
        filePathRelative: pageData.filePathRelative,
        title: pageData.title || getFileNameFromPath(path),
        htmlFilePathRelative: pageData.htmlFilePathRelative,
        permalink: pageData.permalink,
        outlink: pageData.outlink || [],
        backlink: pageData.backlink || []
      },
      x: 0,
      y: 0,
      isCurrent: path === currentPath,
      isIsolated: false,
      linkCount: 0
    };
    
    // 避免重复添加节点
    if (!nodes.find(node => node.id === path)) {
      nodes.push(currentNode);
    }

    // 处理出链（当前页面指向的页面）
    const outlinks = pageData.outlink || [];
    outlinks.forEach((outlink: string) => {
      // 添加链接
      links.push({
        source: path,
        target: outlink,
      });
      
      // 如果目标页面未被访问过，加入队列
      if (!visited.has(outlink) && depth + 1 <= maxDepth) {
        queue.push({ path: outlink, depth: depth + 1 });
      }
    });

    // 处理入链（指向当前页面的页面）
    const backlinks = pageData.backlink || [];
    backlinks.forEach((backlink: string) => {
      // 添加入链关系
      links.push({
        source: backlink,
        target: path,
      });
      
      // 如果来源页面未被访问过，加入队列
      if (!visited.has(backlink) && depth + 1 <= maxDepth) {
        queue.push({ path: backlink, depth: depth + 1 });
      }
    });
  }

  // 更新节点的连接计数和孤立状态
  nodes.forEach(node => {
    node.linkCount = links.filter(link => 
      link.source === node.id || link.target === node.id
    ).length;
    node.isIsolated = node.linkCount === 0;
  });

  log("图谱数据生成完成", { 节点数: nodes.length, 链接数: links.length });
  
  return { nodes, links };
}

/**
 * 从文件路径中提取文件名
 */
function getFileNameFromPath(path: string): string {
  if (!path) return '未知文件';
  const parts = path.split('/');
  const fileName = parts[parts.length - 1];
  return fileName.replace('.md', '').replace(/-/g, ' ') || '未命名';
}

/**
 * 获取全局图谱数据（所有页面的完整图谱）
 */
export async function getGlobalGraphData(): Promise<MapNodeLink> {
  log("开始获取全局图谱数据");
  
  // 如果不是浏览器环境，返回空数据
  if (!isBrowser()) {
    log("非浏览器环境，返回空数据");
    return { nodes: [], links: [] };
  }
  
  return new Promise((resolve, reject) => {
    try {
      Promise.resolve().then(() => {
        try {
          // @ts-ignore
          const globalBioChainMap = window.__BIO_CHAIN_MAP__;
          
          if (!globalBioChainMap) {
            log("未找到全局双链映射表，返回空数据");
            resolve({ nodes: [], links: [] });
            return;
          }

          const graphData = generateGlobalGraphData(globalBioChainMap);
          log("全局图谱数据获取成功", { 
            节点数: graphData.nodes.length, 
            链接数: graphData.links.length 
          });
          resolve(graphData);
        } catch (error) {
          log("生成全局图谱数据时出错", error);
          reject(error);
        }
      });
    } catch (error) {
      log("获取全局图谱数据时出错", error);
      reject(error);
    }
  });
}

/**
 * 生成全局图谱数据（所有页面）
 */
function generateGlobalGraphData(bioChainMap: any): MapNodeLink {
  log("生成全局图谱数据");
  
  const nodes: Node[] = [];
  const links: MapLink[] = [];

  // 遍历所有页面创建节点
  Object.keys(bioChainMap).forEach(path => {
    const pageData = bioChainMap[path];
    
    const node: Node = {
      id: path,
      value: {
        filePathRelative: pageData.filePathRelative,
        title: pageData.title || getFileNameFromPath(path),
        htmlFilePathRelative: pageData.htmlFilePathRelative,
        permalink: pageData.permalink,
        outlink: pageData.outlink || [],
        backlink: pageData.backlink || []
      },
      x: 0,
      y: 0,
      isCurrent: false, // 全局图谱不标记当前节点
      isIsolated: false,
      linkCount: 0
    };
    
    nodes.push(node);

    // 创建出链链接
    const outlinks = pageData.outlink || [];
    outlinks.forEach((outlink: string) => {
      links.push({
        source: path,
        target: outlink,
      });
    });

    // 创建入链链接（backlink 通常已经通过其他页面的 outlink 覆盖）
    // 为避免重复，这里不单独处理 backlink
  });

  // 更新连接计数和孤立状态
  nodes.forEach(node => {
    node.linkCount = links.filter(link => 
      link.source === node.id || link.target === node.id
    ).length;
    node.isIsolated = node.linkCount === 0;
  });

  log("全局图谱数据生成完成", { 节点数: nodes.length, 链接数: links.length });
  
  return { nodes, links };
}
