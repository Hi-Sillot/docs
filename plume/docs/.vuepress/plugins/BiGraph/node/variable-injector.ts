// variable-injector.ts - 变量注入

import type { App } from "vuepress/core";
import { fs, path } from "vuepress/utils";
import type { BiGraphConfig } from "../types";
import { INJECTED_VARIABLES } from "../constants/index";
import { ConfigManager } from "./config-manager";

/**
 * 变量注入器
 */
export class VariableInjector {
  /**
   * 获取需要注入的变量定义
   */
  public static getInjectedVariables(): Record<string, any> {
    const configManager = ConfigManager.getInstance();
    const config = configManager.getMergedConfig();

    return {
      [INJECTED_VARIABLES.FOLD_EMPTY_GRAPH]: config.foldEmptyGraph,
      [INJECTED_VARIABLES.LOCAL_GRAPH_DEEP]: config.localGraphDeep,
      [INJECTED_VARIABLES.MAX_WIDTH]: config.graphMaxWidth,
      [INJECTED_VARIABLES.HEIGHT]: config.graphHeight,
      [INJECTED_VARIABLES.ENABLE_GLOBAL_GRAPH]: config.enableGlobalGraph,
      [INJECTED_VARIABLES.ENABLE_LOCAL_GRAPH]: config.enableLocalGraph,
    };
  }
}

/**
 * 注入全局变量到客户端
 */
export async function injectGlobalVariables(app: App): Promise<string> {
  const tempFile = app.dir.temp('bigraph/client-config.js');
  
  const content = `
// 自动生成的客户端配置
import { defineClientConfig } from 'vuepress/client';

// 在客户端注入全局变量
const globalGraphPath = '/assets/bigraph/global-graph.json';
const bioChainMapPath = '/assets/bigraph/bio-chain-map.json';

export default defineClientConfig({
  enhance({ app, router, siteData }) {
    // 在客户端加载时设置全局变量
    if (typeof window !== 'undefined') {
      // 设置全局变量路径，供客户端组件使用
      window.__BIGRAPH_CONFIG__ = {
        globalGraphPath,
        bioChainMapPath
      };
    }
  },
});
`;

  await fs.ensureDir(path.dirname(tempFile));
  await fs.writeFile(tempFile, content, 'utf-8');
  
  return tempFile;
}