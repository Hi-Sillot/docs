import type * as vp from 'vuepress';
import type { App, Plugin } from "vuepress/core";
export type { App, Plugin };


// export declare const __RELATIONAL_GRAPH_FOLD_EMPTY_GRAPH: boolean;
// export declare const __RELATIONAL_GRAPH_LOCAL_GRAPH_DEEP: number;
// export declare const __RELATIONAL_GRAPH_HEIGHT: number;
// export declare const __RELATIONAL_GRAPH_MAX_WIDTH: number;
// export declare const __RELATIONAL_GRAPH_ENABLE_GLOBAL_GRAPH: boolean;

export interface BioChainData {
    outlink: LinkItem[];
    backlink: LinkItem[];
    localMap: MapNodeLink;
}

// export interface MapNodeLink {
//     nodes: Node[];
//     links: Link[];
// }
/**
 * 节点-链接格式的图谱数据
 */
export interface MapNodeLink {
  nodes: MapNode[];
  links: MapLink[];
}

/**
 * 图谱链接
 */
export interface MapLink {
    source: string | Node;
    target: string | Node;
    isVirtual?: boolean;
}


/**
 * 图谱节点
 */
export interface MapNode {
  id: string;
  value: Omit<BioChainMapItem, 'outlink' | 'backlink'> & {
    outlink: string[];
    backlink: string[];
  };
  linkCount: number;
}
export interface Node {
  id: string;
  value: {
    title: string;
    filePathRelative: string | null;
    htmlFilePathRelative: string | null;
    permalink: string | null;
    outlink: string[];
    backlink: string[];
  };
  linkCount: number;
  isCurrent?: boolean;
  isIsolated?: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface LinkItem {
    title: string;
    link: string;
}




export interface NodeValue {
    title: string;
    filePathRelative: string | null;
    outlink?: string[];
    backlink?: string[];
}



/**
 * 本地映射项
 */
export interface LocalMapItem {
    title: string;
    filePathRelative: string | null;
    htmlFilePathRelative: string | null;
    permalink: string | null;
    outlink: string[];
    backlink: string[];
}

/**
 * 双链映射项
 */
export interface BioChainMapItem {
    title: string;
    filePathRelative: string | null;
    htmlFilePathRelative: string | null;
    permalink: string | null;
    outlink: string[];
    backlink: string[];
}

/**
 * 队列项（用于BFS遍历）
 */
export interface QueueItem {
    path: string;
    depth: number;
}

export interface CanvasSize {
    width: number;
    height: number;
}

export interface MousePosition {
    x: number;
    y: number;
}

export type Page = vp.Page;
/**
 * 标题获取器类型
 */
export type TitleGetter = (page: Page) => string;

export interface BiGraphConfig {
    localGraphDeep?: number; // 局部关系图谱的深度（以当前页面为中心） 默认为5
    foldEmptyGraph?: boolean; // 是否折叠空的关系图谱（只有一个节点） 默认为false
    graphMaxWidth?: number; // 最大宽度 单位: px 默认为 Infinity
    graphHeight?: number; // 度 单位: px  默认为 300
    enableGlobalGraph?: boolean; // 是否启用全局关系图谱 默认为true
    enableLocalGraph?: boolean; // 是否启用局部关系图谱 默认为true
    titleGetter?: TitleGetter; // 标题获取器 需要返回页面的标题 默认为 page的title，如果不存在就用path
}

/**
 * 图谱路径配置
 */
export interface GraphPath {
  target: string;
}

/**
 * 插件上下文
 */
export interface PluginContext {
  options: BiGraphConfig;
  graphPath: GraphPath;
}

export interface ThemeColors {
  accent: string;
  text: string;
  cssVariableName: {
    accent: string;
    text: string;
  };
}