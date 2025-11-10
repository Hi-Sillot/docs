// utils/graph-data.ts

import type { MapNodeLink, Node, MapLink } from "../types";

// 日志计数器
let logCounter = 0;
function log(step: string, data?: any) {
  console.log(`${++logCounter}. [graph-data] ${step}`, data ? data : '');
}

/**
 * 模拟获取图谱数据
 * 在实际应用中，这里应该从API、文件系统或其他数据源获取数据
 */
export async function getGraphData(currentPath: string): Promise<MapNodeLink> {
  log("开始获取图谱数据", { 当前路径: currentPath });
  
  return new Promise((resolve, reject) => {
    try {
      // 模拟网络延迟
      setTimeout(() => {
        try {
          // 这里应该是实际的数据获取逻辑
          // 暂时使用模拟数据
          const mockData = generateMockGraphData(currentPath);
          log("图谱数据获取成功", { 
            节点数: mockData.nodes.length, 
            链接数: mockData.links.length 
          });
          resolve(mockData);
        } catch (error) {
          log("生成模拟数据时出错", error);
          reject(error);
        }
      }, 500); // 模拟500ms网络延迟
    } catch (error) {
      log("获取图谱数据时出错", error);
      reject(error);
    }
  });
}

/**
 * 生成模拟图谱数据
 * 在实际应用中应该替换为真实的数据获取逻辑
 */
function generateMockGraphData(currentPath: string): MapNodeLink {
  log("生成模拟图谱数据", { 当前路径: currentPath });
  
  const nodes: Node[] = [];
  const links: MapLink[] = [];
  
  // 当前节点
  const currentNode: Node = {
    id: currentPath,
    value: {
      filePathRelative: currentPath,
      title: getFileNameFromPath(currentPath),
      htmlFilePathRelative: null,
      permalink: null,
      outlink: [],
      backlink: []
    },
    x: 0,
    y: 0,
    isCurrent: true,
    isIsolated: false,
    linkCount: 0
  };
  nodes.push(currentNode);
  
  // 根据当前路径生成相关节点
  const relatedFiles = generateRelatedFiles(currentPath);
  
  relatedFiles.forEach((file, index) => {
    const node: Node = {
      id: file.path,
      value: {
        filePathRelative: file.path,
        title: file.name,
        htmlFilePathRelative: null,
        permalink: null,
        outlink: [],
        backlink: []
      },
      x: 0,
      y: 0,
      isCurrent: false,
      isIsolated: false,
      linkCount: 0
    };
    nodes.push(node);
    
    // 创建链接（随机连接）
    if (Math.random() > 0.3) { // 70%的概率创建链接
      const link: MapLink = {
        source: currentNode.id,
        target: node.id,
      };
      links.push(link);
    }
  });
  
  // 在相关节点之间创建一些链接
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].id !== currentNode.id && nodes[j].id !== currentNode.id && Math.random() > 0.7) {
        const link: MapLink = {
          source: nodes[i].id,
          target: nodes[j].id,
        };
        links.push(link);
      }
    }
  }
  
  // 更新连接数
  nodes.forEach(node => {
    node.linkCount = links.filter(link => 
      link.source === node.id || link.target === node.id
    ).length;
    node.isIsolated = node.linkCount === 0;
  });
  
  log("模拟数据生成完成", { 节点数: nodes.length, 链接数: links.length });
  
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
 * 生成相关文件列表
 */
function generateRelatedFiles(currentPath: string): Array<{path: string, name: string}> {
  const baseDir = currentPath.split('/').slice(0, -1).join('/');
  const fileName = getFileNameFromPath(currentPath);
  
  // 生成一些模拟的相关文件
  const relatedFiles = [];
  const fileCount = Math.floor(Math.random() * 8) + 3; // 3-10个相关文件
  
  for (let i = 0; i < fileCount; i++) {
    const fileType = Math.random() > 0.5 ? '相关' : '参考';
    relatedFiles.push({
      path: `${baseDir}/${fileName}-${fileType}-${i + 1}.md`,
      name: `${fileName} ${fileType} ${i + 1}`
    });
  }
  
  return relatedFiles;
}

/**
 * 从VuePress页面数据生成图谱数据
 * 这是更实际的实现方式
 */
export async function getGraphDataFromVuePress(currentPath: string): Promise<MapNodeLink> {
  log("从VuePress数据生成图谱数据", { 当前路径: currentPath });
  
  try {
    // 尝试从全局变量获取页面数据
    // @ts-ignore
    const pages = window.__VUEPRESS_PAGES__ || [];
    
    if (pages.length === 0) {
      log("未找到页面数据，使用模拟数据");
      return getGraphData(currentPath);
    }
    
    const nodes: Node[] = [];
    const links: MapLink[] = [];
    
    // 创建节点
    pages.forEach((page: any) => {
      const node: Node = {
        id: page.path,
        value: {
          filePathRelative: page.path,
          title: page.title  || getFileNameFromPath(page.path),
          htmlFilePathRelative: null,
          permalink: null,
          outlink: [],
          backlink: []
        },
        x: 0,
        y: 0,
        isCurrent: page.path === currentPath,
        isIsolated: false,
        linkCount: 0
      };
      nodes.push(node);
    });
    
    // 创建链接（基于文件路径的相似性）
    nodes.forEach((sourceNode, index) => {
      nodes.forEach((targetNode, targetIndex) => {
        if (index !== targetIndex) {
          const sourceDir = sourceNode.id.split('/').slice(0, -1).join('/');
          const targetDir = targetNode.id.split('/').slice(0, -1).join('/');
          
          // 相同目录下的文件有更高概率连接
          if (sourceDir === targetDir && Math.random() > 0.5) {
            links.push({
              source: sourceNode.id,
              target: targetNode.id,
            });
          }
          // 当前文件与所有文件都有连接
          else if (sourceNode.id === currentPath && Math.random() > 0.7) {
            links.push({
              source: sourceNode.id,
              target: targetNode.id,
            });
          }
        }
      });
    });
    
    // 更新连接数和孤立状态
    nodes.forEach(node => {
      node.linkCount = links.filter(link => 
        link.source === node.id || link.target === node.id
      ).length;
      node.isIsolated = node.linkCount === 0;
    });
    
    log("VuePress数据生成完成", { 节点数: nodes.length, 链接数: links.length });
    
    return { nodes, links };
  } catch (error) {
    log("从VuePress生成数据失败，使用模拟数据", error);
    return getGraphData(currentPath);
  }
}