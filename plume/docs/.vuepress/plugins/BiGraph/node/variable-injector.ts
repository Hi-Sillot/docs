// variable-injector.ts - 变量注入

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