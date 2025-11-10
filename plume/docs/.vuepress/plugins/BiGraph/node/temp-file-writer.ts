// temp-file-writer.ts - 临时文件写入

import type { App } from "vuepress/core";
import { TEMP_FILE_NAMES } from "../constants/index";

/**
 * 临时文件写入器
 */
export class TempFileWriter {
  /**
   * 写入生物图谱临时文件
   */
  public static async writeBioTempFile(app: App): Promise<void> {
    const content = this.generateBioTempFileContent(app.pages);
    await app.writeTemp(TEMP_FILE_NAMES.BIO_TS, content);
  }

  /**
   * 生成临时文件内容
   */
  private static generateBioTempFileContent(pages: any[]): string {
    return `
const pages = ${JSON.stringify(pages)};
export async function f(store, app) {
  store.initializeBioChain(pages);  // 初始化双链映射
}
`;
  }
}