<!-- .vuepress/components/AuthorLink.vue -->
<script setup>
import { usePageData } from 'vuepress/client'
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'

const page = usePageData()
const authors = computed(() => {
  const authorData = page.value.frontmatter.author || []
  return Array.isArray(authorData) ? authorData : [authorData]
})

// 响应式数据
const isExpanded = ref(false)
const isOverflowing = ref(false)
const containerRef = ref(null)
const contentRef = ref(null)

// 检查是否需要折叠
const checkOverflow = () => {
  if (!containerRef.value || !contentRef.value) return

  nextTick(() => {
    const containerWidth = containerRef.value.offsetWidth
    const contentWidth = contentRef.value.scrollWidth

    // 检查内容是否超出容器宽度
    isOverflowing.value = contentWidth > containerWidth
  })
}

// 切换展开/折叠状态
const toggleExpand = () => {
  if (isOverflowing.value) {
    isExpanded.value = !isExpanded.value
  }
}

// 点击外部区域收起
const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    isExpanded.value = false
  }
}

// 生命周期
onMounted(() => {
  // 初始检查
  checkOverflow()

  // 监听窗口大小变化
  window.addEventListener('resize', checkOverflow)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkOverflow)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div v-if="authors.length > 0" ref="containerRef" class="author-links" :class="{
    'expanded': isExpanded,
    'overflowing': isOverflowing,
    'single-author': authors.length === 1
  }" @click="toggleExpand">
    <span class="authors-label">本文编辑：</span>

    <div ref="contentRef" class="authors-content">
      <RouteLink v-for="(author, index) in authors" :key="author.slug" :to="`/authors/${author.slug}`"
        class="author-link" @click.stop>
        <!-- 作者头像 -->
        <div class="avatar-container">
          <img v-if="author.avatar" :src="author.avatar" class="avatar" :alt="author.name" />
          <div v-else class="avatar-placeholder">
            {{ author.name.charAt(0).toUpperCase() }}
          </div>
        </div>

        <!-- 作者姓名 -->
        <span class="author-name">{{ author.name }}</span>

        <!-- 分隔符（非最后一个作者） -->
        <span v-if="index < authors.length - 1" class="author-separator">,</span>
      </RouteLink>
    </div>

    <!-- 折叠/展开指示器 -->
    <div v-if="isOverflowing" class="expand-indicator">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" />
      </svg>
      <span class="expand-text">{{ isExpanded ? '收起全部' : `展开全部` }}</span>
    </div>

    <!-- 展开时的浮动面板 -->
    <div v-if="isExpanded" class="author-popover">
      <div class="popover-header">
        <h4>本文编辑</h4>
        <button class="close-popover" @click.stop="isExpanded = false">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </button>
      </div>
      <div class="popover-authors">
        <RouteLink v-for="author in authors" :key="author.slug" :to="`/authors/${author.slug}`" class="popover-author">
          <div class="avatar-container">
            <img v-if="author.avatar" :src="author.avatar" class="avatar" :alt="author.name" />
            <div v-else class="avatar-placeholder">
              {{ author.name.charAt(0).toUpperCase() }}
            </div>
          </div>
          <span class="author-name">{{ author.name }}</span>
        </RouteLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.author-links {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 1rem;
  padding: 8px 12px;
  background: var(--vp-c-bg-soft);
  border-radius: 20px;
  border: 1px solid var(--vp-c-border);
  font-size: 0.9rem;
  line-height: 1;
  max-width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  user-select: none;
}

.author-links:hover {
  background: var(--vp-c-bg-soft-up);
  border-color: var(--vp-c-brand-light);
}

.author-links.expanded {
  background: var(--vp-c-bg-soft-up);
  border-color: var(--vp-c-brand-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.authors-label {
  color: var(--vp-c-text-2);
  font-weight: 500;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.authors-content {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.author-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: var(--vp-c-text-1);
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 16px;
  flex-shrink: 0;
  max-width: 100%;
}

.author-link:hover {
  background: var(--vp-c-bg-soft-up);
  color: var(--vp-c-brand);
  transform: translateY(-1px);
}

/* 头像容器 */
.avatar-container {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.author-link:hover .avatar {
  transform: scale(1.1);
}

.avatar-placeholder {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--vp-c-brand) 0%, var(--vp-c-brand-light) 100%);
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 作者姓名 */
.author-name {
  font-weight: 500;
  transition: color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

/* 作者分隔符 */
.author-separator {
  margin-left: 4px;
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}

/* 折叠/展开指示器 */
.expand-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
  padding: 2px 6px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft-down);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.author-links:hover .expand-indicator {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand);
}

.expand-text {
  white-space: nowrap;
}

/* 浮动面板 */
.author-popover {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  padding: 12px;
  margin-top: 8px;
  z-index: 20;
  animation: popoverFadeIn 0.2s ease;
}

@keyframes popoverFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--vp-c-border);
}

.popover-header h4 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.close-popover {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  border-radius: 4px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-popover:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.popover-authors {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.popover-author {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--vp-c-text-1);
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.popover-author:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand);
}

.popover-author .avatar {
  width: 32px;
  height: 32px;
}

.popover-author .avatar-placeholder {
  width: 32px;
  height: 32px;
  font-size: 0.9rem;
}

/* 单个作者时的特殊样式 */
.author-links.single-author {
  cursor: default;
}

.author-links.single-author:hover {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-border);
}

/* 响应式调整 */
@media (max-width: 640px) {
  .author-links {
    flex-wrap: wrap;
    padding: 6px 10px;
    max-width: 100%;
  }

  .authors-label {
    font-size: 0.8rem;
  }

  .author-name {
    font-size: 0.85rem;
    max-width: 100px;
  }

  .author-popover {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 300px;
    margin-top: 0;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .author-links {
    background: var(--vp-c-bg-soft-down);
    border-color: var(--vp-c-border);
  }

  .author-link:hover {
    background: var(--vp-c-bg-soft);
  }
}

/* 动画效果 */
.author-links {
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>