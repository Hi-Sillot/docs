// utils/graph-data-loader.ts

/**
 * 客户端数据加载器
 */
export class GraphDataLoader {
  /**
   * 加载全局图谱数据
   */
  static async loadGlobalGraph(): Promise<any> {
    try {
      // 从配置中获取路径
      const config = (window as any).__BIGRAPH_CONFIG__;
      if (!config?.globalGraphPath) {
        throw new Error('全局图谱路径未配置');
      }
      
      const response = await fetch(config.globalGraphPath);
      if (!response.ok) {
        throw new Error(`加载全局图谱失败: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('加载全局图谱数据失败:', error);
      return null;
    }
  }
  
  /**
   * 加载生物链映射表
   */
  static async loadBioChainMap(): Promise<any> {
    try {
      const config = (window as any).__BIGRAPH_CONFIG__;
      if (!config?.bioChainMapPath) {
        throw new Error('生物链映射表路径未配置');
      }
      
      const response = await fetch(config.bioChainMapPath);
      if (!response.ok) {
        throw new Error(`加载生物链映射表失败: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('加载生物链映射表失败:', error);
      return null;
    }
  }
  
  /**
   * 初始化全局数据
   */
  static async initialize(): Promise<boolean> {
    try {
      // 并行加载数据
      const [globalGraph, bioChainMap] = await Promise.all([
        this.loadGlobalGraph(),
        this.loadBioChainMap()
      ]);
      
      if (globalGraph && bioChainMap) {
        // 设置到全局变量
        (window as any).__BIO_CHAIN_MAP__ = bioChainMap;
        (window as any).__GLOBAL_GRAPH__ = globalGraph;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('初始化图谱数据失败:', error);
      return false;
    }
  }
}