import type { Page, Plugin } from "@vuepress/core";
import type { AuthorConfig, AuthorInfo, PostMeta } from "./types";
import AuthorDetail from "../../layouts/AuthorDetail.vue";
import { useAuthorStore } from "../../stores/author";

export default (): Plugin => ({
  name: "author-data",
  async onInitialized(app) {
    console.log("[author-data] 开始处理作者数据..."); // 添加起始日志

    const authorMap = new Map<string, AuthorConfig>();
    let processedCount = 0;

    app.pages.forEach((page: Page) => {
      const frontmatter = page.frontmatter as { author?: unknown };

      // 安全类型转换（处理多种格式）
      const authors: AuthorInfo[] = [];
      if (Array.isArray(frontmatter.author)) {
        authors.push(
          ...frontmatter.author.filter((a) => typeof a === "object"),
        );
      } else if (typeof frontmatter.author === "object") {
        authors.push(frontmatter.author as AuthorInfo);
      } else if (typeof frontmatter.author === "string") {
        authors.push({
          name: frontmatter.author,
          slug: frontmatter.author.toLowerCase().replace(/\s+/g, "-"),
        });
      }

      // 调试输出（输出到构建终端）
      if (authors.length > 0) {
        console.log(
          `[author-data] 在页面 ${page.path} 中发现 ${authors.length} 位作者`,
        );
        authors.forEach((a) => {
          console.log(`  作者: ${a.name} (${a.slug})`);
        });
      }

      authors.forEach((author) => {
        const slug = author.slug ||
          author.name.toLowerCase().replace(/\s+/g, "-");
        const postMeta: PostMeta = {
          title: page.title || "Untitled",
          path: page.path,
          date: String(page.data.frontmatter.createTime) || page.date,
        };

        if (!authorMap.has(slug)) {
          authorMap.set(slug, {
            ...author,
            slug, // 确保slug存在
            posts: [postMeta],
          });
        } else {
          authorMap.get(slug)!.posts.push(postMeta);
        }
        processedCount++;
      });
    });

    console.log(`[author-data] 共处理 ${processedCount} 位作者关联`);

    // 写入TS格式的临时文件
    await app.writeTemp(
      "author-data.ts",
      `import type { AuthorConfig } from '../plugins/Author/types';\n` +
        `export default ${
          JSON.stringify(Object.fromEntries(authorMap))
        } as Record<string, AuthorConfig>;`,
    );

    console.log("[author-data] 作者数据已写入临时文件");
  },
});
