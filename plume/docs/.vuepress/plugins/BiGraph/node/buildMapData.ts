import type {BioChainMapItem, LocalMapItem, MapNodeLink, Page, QueueItem, TitleGetter} from "../types/index.js";
import {fs, path} from "vuepress/utils";
import {App} from "vuepress/core";
import { options } from "../config/options.js";
// import {options} from "./index";
// import {graphDataName} from "../client/useGlobalGraph.js";

export const bioChainMap: Record<string, BioChainMapItem> = {};
let max_deep = 5;

function generateLocalMap(root: string): MapNodeLink {
    max_deep = options.localGraphDeep || 5;

    const localMap: Record<string, LocalMapItem> = {};
    const queue: QueueItem[] = [
        {
            path: root,
            depth: 0,
        },
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const {path, depth} = queue.shift()!;

        if (depth > max_deep || visited.has(path)) {
            continue;
        }

        visited.add(path);
        localMap[path] = {
            title: bioChainMap[path].title,
            filePathRelative: path,
            htmlFilePathRelative: bioChainMap[path].htmlFilePathRelative,
            permalink: bioChainMap[path].permalink,
            outlink: [],
            backlink: [],
        };

        const outlinks = bioChainMap[path]?.outlink;
        const backlinks = bioChainMap[path]?.backlink;

        outlinks?.forEach((link) => {
            if (!visited.has(link) && depth + 1 <= max_deep) {
                queue.push({
                    path: link,
                    depth: depth + 1,
                });
                localMap[path]?.outlink.push(link);
            }
        });

        backlinks?.forEach((link) => {
            if (!visited.has(link) && depth + 1 <= max_deep) {
                queue.push({
                    path: link,
                    depth: depth + 1,
                });
                localMap[path]?.backlink.push(link);
            }
        });
    }
    // 转成node-link的格式
    const localMapNodeLink: MapNodeLink = {
        nodes: [],
        links: [],
    };
    for (const key of Object.keys(localMap)) {
        localMapNodeLink.nodes.push({
            id: key,
            value: {
                ...localMap[key],
            },
            linkCount: 0
        });
        localMap[key].outlink.forEach((link) => {
            localMapNodeLink.links.push({
                source: key,
                target: link,
            });
        });
        localMap[key].backlink.forEach((link) => {
            localMapNodeLink.links.push({
                source: link,
                target: key,
            });
        });
    }
    return localMapNodeLink;
}

export function buildGlobalMap(): MapNodeLink {
    const graph: MapNodeLink = {
        nodes: [],
        links: [],
    };

    // 遍历所有页面添加节点
    for (const path of Object.keys(bioChainMap)) {
        console.log(path)
        graph.nodes.push({
            id: path,
            value: {
                title: bioChainMap[path].title,
                filePathRelative: path,
                htmlFilePathRelative: bioChainMap[path].htmlFilePathRelative,
            permalink: bioChainMap[path].permalink,
                outlink: bioChainMap[path].outlink,
                backlink: bioChainMap[path].backlink,
            },
            linkCount: 0
        });
        bioChainMap[path].backlink.forEach((link) => {
            graph.links.push({
                source: link,
                target: path,
            });
        });
        bioChainMap[path].outlink.forEach((link) => {
            graph.links.push({
                source: path,
                target: link,
            });
        });
    }

    return graph;
}

function write_to_frontmatter(page: Page): void {
    // 第三次遍历 写入到页面中
    // @ts-ignore
    const bioChain = bioChainMap[page.data.filePathRelative];

    if (!bioChain) {
        return;
    }
    //去个重
    bioChain.outlink = [...new Set(bioChain.outlink)];
    bioChain.backlink = [...new Set(bioChain.backlink)];

    const outlink_array = JSON.parse(JSON.stringify(bioChain.outlink));
    const backlink_array = JSON.parse(JSON.stringify(bioChain.backlink));

    const outlink_result: { title: string; link: string }[] = [];
    for (let i = 0; i < outlink_array.length; i++) {
        let link = outlink_array[i];
        const parsedLink = path.parse(link);
        if (parsedLink.ext === '.md') {
            link = path.format({ ...parsedLink, ext: '.html'});
        }
        outlink_result.push({
            title: bioChainMap[outlink_array[i]].title,
            link: link,
        });
    }

    const backlink_result: { title: string; link: string }[] = [];
    for (let i = 0; i < backlink_array.length; i++) {
        let link = backlink_array[i];
        const parsedLink = path.parse(link);
        if (parsedLink.ext === '.md') {
            link = path.format({ ...parsedLink, ext: '.html'});
        }
        backlink_result.push({
            title: bioChainMap[backlink_array[i]].title,
            link: link,
        });
    }

    const filePath = page.data.filePathRelative;
    if (!filePath) return; // 先校验是否为 null/undefined
    // 添加 null 校验，确保 filePath 是字符串
    let localMap: MapNodeLink | undefined;
    if (typeof filePath === 'string') {
        localMap = generateLocalMap(filePath);
    } else {
        // 可选：处理 filePath 为 null 的情况（如记录日志或设置默认值）
        console.warn('page.filePathRelative is null, localMap will be undefined');
    }

    page.data.bioChainData = {
        outlink: outlink_result,
        backlink: backlink_result,
        localMap: localMap,
    };
}

export function buildBioChainMap(pages: Page[], titleGetter: TitleGetter = (page) => {
    if (!page.title || page.title.trim() === "") {
        return page.filePathRelative ?? '未命名'; // 兜底处理，避免返回 null
    }
    return page.title;
}): void {
    // 过滤掉 filePathRelative 为 null 的页面
    const validPages = pages.filter(page => typeof page.filePathRelative === 'string');

    // 生成双链（仅处理有效页面）
    for (const page of validPages) {
        if (page.links.length>-1) {console.warn('111', page)}
        const filePathRelative = page.filePathRelative!; // 已过滤，必为 string
        bioChainMap[filePathRelative] = {
            title: titleGetter(page),
            filePathRelative: page.filePathRelative,
            htmlFilePathRelative: page.htmlFilePathRelative,
            permalink: page.permalink,
            outlink: [],
            backlink: [],
        };
    }

    // 第二次遍历（仅处理有效页面）
    for (const page of validPages) {
        const permalink = page.permalink!; // 已过滤，必为 string
        const links: string[] = [];
        for (const link of page.links) {
            links.push(decodeURIComponent(link.relative));
        }
        links.forEach((link) => {
            if (bioChainMap[link]) { // 检查 link 是否存在于 bioChainMap 中
                bioChainMap[link].backlink.push(permalink); // 使用已过滤的 filePath
                bioChainMap[permalink].outlink.push(link);
            }
        });
    }

    // 第三次遍历（仅处理有效页面）
    // for (const page of validPages) {
    //     write_to_frontmatter(page);
    // }
}


// export async function writeGlobalGraph(app: App): Promise<void> {
//     const globalMap = buildGlobalMap();
//     const location = app.dir.dest(graphDataName);
//     await fs.ensureDir(path.dirname(location));
//     await fs.writeFile(location, JSON.stringify(globalMap), "utf-8");
// }

// export function writeTempGlobalGraph(app: App): string {
//     const globalMap = buildGlobalMap();
//     const location = app.dir.temp(graphDataName);
//     fs.ensureDirSync(path.dirname(location));
//     fs.writeFileSync(location, JSON.stringify(globalMap), "utf-8");

//     // 计算出路径 后面导入用
//     const projectRoot = app.dir.source();

//     return path.relative(projectRoot, location);
// }