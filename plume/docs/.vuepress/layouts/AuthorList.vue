<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthorStore } from '../stores/author'
import Base from './Base.vue'

const route = useRoute()
const authorStore = useAuthorStore()

// 从Pinia获取作者数据
const authors = computed(() =>  authorStore.getAuthors())
const goToAuthor = (slug) => {
  alert(`/authors/${slug}`)
}
</script>

<template>
  <Base>
    <template #custom-content>
      <div class="author-list base-content">
    <router-link 
      v-for="author in authors"
      :key="author.slug"
      :to="`/authors/${author.slug}`"
      class="author-card"
    >
      <div class="author-header">
        <img v-if="author.avatar" :src="author.avatar" class="avatar" />
        <h2>{{ author.name }}</h2>
      </div>
      <div class="post-count">{{ author.posts.length }} 篇文章</div>
    </router-link>
  </div>
</template>

  </Base>

</template>

<style scoped>
.author-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 2rem;
}
.author-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.author-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
.author-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}
.post-count {
  margin-top: 8px;
  color: #666;
  font-size: 0.9rem;
}

</style>
