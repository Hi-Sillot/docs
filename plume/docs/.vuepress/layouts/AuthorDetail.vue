<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthorStore } from '../stores/author'
import Base from './Base.vue'

const route = useRoute()
// docs/authors/:slug 的文件的 permalink 应当为 /authors/:slug


// 情况1：标准动态路由（直接获取 slug）
let slug = route.params.slug as string

// 情况2：Catch-All 路由（需解析路径）
if (route.params.catchAll) {
  const pathSegments = route.params.catchAll.toString().split('/').filter(Boolean);
  slug = pathSegments[pathSegments.length - 1]; // 取最后一段作为 slug
}

const authorStore = useAuthorStore()

// 从Pinia获取作者数据
const author = computed(() => authorStore.getAuthor(slug))

</script>

<template>
  <Base>
  <template #custom-content>
    <div class="base-content">
      <RouteLink to="/authors">查看所有作者</RouteLink>
      <div v-if="author" class="author-detail">
        <div class="author-header">
          <img v-if="author.avatar" :src="author.avatar" class="avatar" />
          <h1>{{ author.name }}</h1>
        </div>

        <div class="posts-list">
          <h2>文章列表</h2>
          <ul>
            <li v-for="post in author.posts" :key="post.path">
              <RouteLink :to=post.path>{{ post.title }}</RouteLink>
              <span class="post-date">{{ post.date }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div v-else class="not-found">
        <h1>作者 {{slug}} 不存在</h1>
        <p>{{  route.params }}</p>
      </div>
    </div>
  </template>
  </Base>

</template>

<style scoped>
.author-detail {
  max-width: 800px;
  margin: 0 auto;
}

.author-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
}

.posts-list ul {
  list-style: none;
  padding: 0;
}

.posts-list li {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.post-date {
  margin-left: 16px;
  color: #888;
  font-size: 0.9rem;
}
</style>
