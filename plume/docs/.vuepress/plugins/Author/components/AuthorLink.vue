<!-- .vuepress/components/AuthorLink.vue -->
<script setup>
import { usePageData } from 'vuepress/client'
import { computed } from 'vue'

const page = usePageData()
const authors = computed(() => {
  const authorData = page.value.frontmatter.author || []
  return Array.isArray(authorData) ? authorData : [authorData]
})
</script>

<template>
  <div class="author-links">
    <RouteLink 
      v-for="author in authors"
      :key="author.slug"
      :to="`/authors/${author.slug}`"
      class="author-link"
    >
      <img v-if="author.avatar" :src="author.avatar" class="avatar" />
      {{ author.name }}
    </RouteLink>
  </div>
</template>

<style scoped>
.author-links {
  display: flex;
  gap: 12px;
  margin-top: 1rem;
}
.author-link {
  display: flex;
  align-items: center;
  gap: 6px;
}
.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}
</style>
