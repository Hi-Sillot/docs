// models/bio-chain-map.ts - 双链映射数据模型

import type { BioChainMapItem } from "../types";

/**
 * 双链映射管理器
 */
export class BioChainMap {
  private map: Record<string, BioChainMapItem> = {};

  /**
   * 设置映射项
   */
  public setItem(key: string, item: BioChainMapItem): void {
    this.map[key] = item;
  }

  /**
   * 获取映射项
   */
  public getItem(key: string): BioChainMapItem | undefined {
    return this.map[key];
  }

  /**
   * 检查是否存在映射项
   */
  public hasItem(key: string): boolean {
    return key in this.map;
  }

  /**
   * 获取所有键
   */
  public getKeys(): string[] {
    return Object.keys(this.map);
  }

  /**
   * 获取整个映射
   */
  public getMap(): Record<string, BioChainMapItem> {
    return this.map;
  }

  /**
   * 清空映射
   */
  public clear(): void {
    this.map = {};
  }
}

export const bioChainMap = new BioChainMap();