// // node/buildMapData.ts

// import type { App, Page } from "vuepress/core";
// import { fs, path } from "vuepress/utils";
// import { GlobalMapBuilder } from "../builders/global-map-builder";
// import { bioChainMap } from "../models/bio-chain-map";
// import { BioChainService } from "../services/bio-chain-service";

// /**
//  * 构建并写入双链数据
//  */
// export async function buildAndWriteMapData(app: App, pages: Page[]): Promise<void> {
//   // 1. 构建双链映射表
//   // BioChainService.buildBioChainMap(pages);
  
//   // 2. 构建全局图谱数据
//   const globalGraph = GlobalMapBuilder.build();
  
//   // 3. 将全局图谱数据写入临时文件
//   await writeGlobalGraphToTemp(app, globalGraph);
  
//   // 4. 将全局图谱数据写入输出目录（用于生产环境）
//   await writeGlobalGraphToDest(app, globalGraph);
  
//   // 5. 将 bioChainMap 写入文件，供客户端使用
//   await writeBioChainMapToClient(app);
// }

// /**
//  * 将全局图谱写入临时文件（用于开发环境）
//  */
// async function writeGlobalGraphToTemp(app: App, globalGraph: any): Promise<string> {
//   const tempPath = app.dir.temp('bigraph/global-graph.json');
//   await fs.ensureDir(path.dirname(tempPath));
//   await fs.writeFile(tempPath, JSON.stringify(globalGraph), 'utf-8');
//   return tempPath;
// }

// /**
//  * 将全局图谱写入输出目录（用于生产环境）
//  */
// async function writeGlobalGraphToDest(app: App, globalGraph: any): Promise<void> {
//   const destPath = app.dir.dest('assets/bigraph/global-graph.json');
//   await fs.ensureDir(path.dirname(destPath));
//   await fs.writeFile(destPath, JSON.stringify(globalGraph), 'utf-8');
// }

// /**
//  * 将 bioChainMap 写入客户端可访问的文件
//  */
// async function writeBioChainMapToClient(app: App): Promise<void> {
//   const clientPath = app.dir.dest('assets/bigraph/bio-chain-map.json');
//   await fs.ensureDir(path.dirname(clientPath));
//   await fs.writeFile(clientPath, JSON.stringify(bioChainMap), 'utf-8');
// }