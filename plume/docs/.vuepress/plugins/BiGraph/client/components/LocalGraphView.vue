<!-- components/LocalGraphView.vue -->
<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vuepress/client";
import RelationGraph from "./RelationGraphCanvas.vue";
import GraphButtons from "./GraphButtons.vue";
import ToggleButton from "./ToggleButton.vue";
import { useGraphData } from "../composables/useGraphData";
import { useGraphOptions } from "../composables/useGraphOptions";
import { useScreenSize } from "../composables/useScreenSize";
import { useContainerSize } from "../composables/useContainerSize";
import { useFullscreen } from "../composables/useFullscreen";
import { useBioChainStore } from "../../stores/bioChain";
// import { useBioChainStore } from "../../stores/bio-chain-store";

let TAG = "LocalGraphView.vue"
// 日志计数器
let logCounter = 0;
function log(step: string, data?: any) {
  console.log(`[${TAG}] ${++logCounter}. [RelationshipMap] ${step}`, data ? data : '');
}

// Store
const bioStore = useBioChainStore();
const router = useRouter();
log("Store 和 Router 初始化完成", { 
  hasBioStore: !!bioStore, 
  hasRouter: !!router 
});

// Refs
const containerRef = ref<HTMLElement | null>(null);
const fullscreenContainerRef = ref<HTMLElement | null>(null);
const graphRef = ref<InstanceType<typeof RelationGraph> | null>(null);
const fullscreenGraphRef = ref<InstanceType<typeof RelationGraph> | null>(null);

// Composables
const { mapData, isLoading, error, handleNodeClick, shouldFoldEmptyGraph, reloadData } = useGraphData();
const { options } = useGraphOptions();
const { screenState, toggleExpand, forceUpdateContainerWidth } = useScreenSize();
const { canvasSize } = useContainerSize(containerRef, screenState, options);
const { fullscreenState, toggleFullscreen } = useFullscreen(fullscreenContainerRef, ref(null));

log("Composables 初始化完成", {
  mapData: mapData.value,
  canvasSize: canvasSize.value,
  fullscreenState: fullscreenState.value
});

// 响应式数据
let resizeObserver: ResizeObserver | null = null;
let isMounted = ref(false);

// 方法
const restartSimulation = (): void => {
  log("restartSimulation 被调用", { 
    isMounted: isMounted.value,
    hasGraphRef: !!graphRef.value 
  });
  
  if (!isMounted.value || !graphRef.value) {
    console.warn("组件未挂载或图谱引用不存在，跳过重启模拟器");
    return;
  }
  
  nextTick(() => {
    try {
      graphRef.value?.restartSimulation();
      log("正常模式模拟器重启完成");
    } catch (error) {
      console.error("重启正常模式模拟器失败:", error);
    }
  });
};

const restartFullscreenSimulation = (): void => {
  log("restartFullscreenSimulation 被调用", { 
    isFullscreen: fullscreenState.value.isFullscreen,
    hasFullscreenGraphRef: !!fullscreenGraphRef.value 
  });
  
  if (!fullscreenState.value.isFullscreen || !fullscreenGraphRef.value) {
    console.warn("全屏模式未激活或全屏图谱引用不存在，跳过重启");
    return;
  }
  
  nextTick(() => {
    try {
      fullscreenGraphRef.value?.restartSimulation();
      log("全屏模式模拟器重启完成");
    } catch (error) {
      console.error("重启全屏模式模拟器失败:", error);
    }
  });
};

// 安全的节点点击处理
const safeHandleNodeClick = (path: string): void => {
  log("节点点击事件", { path, hasRouter: !!router });
  try {
    handleNodeClick(path);
    log("节点点击处理完成");
  } catch (error) {
    console.error("处理节点点击时出错:", error);
  }
};

// 安全的切换全屏
const safeToggleFullscreen = (): void => {
  log("切换全屏开始", { 
    currentState: fullscreenState.value.isFullscreen,
    hasContainer: !!fullscreenContainerRef.value 
  });
  
  try {
    toggleFullscreen();
    log("切换全屏完成", { 
      newState: fullscreenState.value.isFullscreen 
    });
    
    // 全屏切换后重新启动模拟器
    if (fullscreenState.value.isFullscreen) {
      nextTick(() => {
        setTimeout(() => {
          restartFullscreenSimulation();
        }, 100);
      });
    }
  } catch (error) {
    console.error("切换全屏时出错:", error);
  }
};

// 安全的切换展开状态
const safeToggleExpand = (): void => {
  log("切换展开状态开始", { 
    currentState: screenState.value.isExpanded,
    isLargeScreen: screenState.value.isLargeScreen 
  });
  
  try {
    toggleExpand();
    log("切换展开状态完成", { 
      newState: screenState.value.isExpanded 
    });
    
    // 展开状态变化后重新启动模拟器
    if (screenState.value.isExpanded) {
      nextTick(() => {
        setTimeout(() => {
          restartSimulation();
        }, 100);
      });
    }
  } catch (error) {
    console.error("切换展开状态时出错:", error);
  }
};

// 重新加载数据
const handleReload = (): void => {
  log("手动重新加载数据");
  reloadData();
};

// 监听数据加载状态
watch(isLoading, (newLoading, oldLoading) => {
  log("数据加载状态变化", { 之前: oldLoading, 现在: newLoading });
  
  if (!newLoading) {
    // 数据加载完成，重启模拟器
    nextTick(() => {
      setTimeout(() => {
        if (fullscreenState.value.isFullscreen) {
          restartFullscreenSimulation();
        } else {
          restartSimulation();
        }
      }, 200);
    });
  }
});

// 监听数据变化
watch(mapData, (newData, oldData) => {
  log("图谱数据变化", {
    旧节点数: oldData?.nodes?.length || 0,
    新节点数: newData?.nodes?.length || 0,
    旧链接数: oldData?.links?.length || 0,
    新链接数: newData?.links?.length || 0
  });
}, { deep: true });

// 生命周期
onMounted(() => {
  log("onMounted 开始执行");
  isMounted.value = true;

  try {
    resizeObserver = new ResizeObserver((entries) => {
      log("容器尺寸变化", { 
        entryCount: entries.length,
        isFullscreen: fullscreenState.value.isFullscreen 
      });
      
      for (const entry of entries) {
        if (entry.target === containerRef.value) {
          log("主容器尺寸变化", {
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
          // 容器尺寸变化后重启模拟器
          if (!isLoading.valueOf) {
            nextTick(() => {
              restartSimulation();
            });
          }
        } else if (entry.target === fullscreenContainerRef.value) {
          log("全屏容器尺寸变化", {
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
          // 全屏容器尺寸变化后重启模拟器
          if (!isLoading.valueOf) {
            nextTick(() => {
              restartFullscreenSimulation();
            });
          }
        }
      }
    });

    if (containerRef.value) {
      resizeObserver.observe(containerRef.value);
      log("主容器 ResizeObserver 已监听");
    } else {
      console.warn("主容器引用为空，无法监听尺寸变化");
    }

    // 初始启动模拟器（等数据加载完成）
    if (!isLoading.valueOf) {
      nextTick(() => {
        setTimeout(() => {
          restartSimulation();
        }, 300);
      });
    }

    log("onMounted 执行完成");
  } catch (error) {
    console.error("onMounted 执行出错:", error);
  }
});

onUnmounted(() => {
  log("onUnmounted 开始执行");
  isMounted.value = false;

  try {
    if (resizeObserver) {
      resizeObserver.disconnect();
      log("ResizeObserver 已断开");
    } else {
      console.warn("ResizeObserver 为 null，无需断开");
    }
    
    log("组件卸载完成");
  } catch (error) {
    console.error("onUnmounted 执行出错:", error);
  }
});

log(`${TAG} 组件初始化完成`);
</script>

<template>
  <!-- 主容器，显示在文章右侧 -->
  <div v-if="shouldFoldEmptyGraph" class="relationship-map">

    <!-- 切换按钮 -->
    <ToggleButton
      v-if="screenState.isLargeScreen"
      :is-expanded="screenState.isExpanded"
      @toggle="safeToggleExpand"
    />

    <!-- 图谱容器 -->
    <div
    v-if="screenState.isLargeScreen && screenState.isExpanded"
      ref="containerRef"
      :class="{
        'relationship-map__container--expanded': screenState.isExpanded,
        'relationship-map__container--loading': isLoading,
        'relationship-map__container--error': error
      }"
      :style="
        screenState.isLargeScreen
          ? {
              width: screenState.containerWidth + 'px',
              height: options.graphSize.height + 'px',
            }
          : {}
      "
      class="relationship-map__container"
    >
      <!-- 加载状态 -->
      <div v-if="isLoading" class="relationship-map__loading">
        <div class="relationship-map__spinner"></div>
        <p>加载关系中...</p>
        <button v-if="error" @click="handleReload" class="relationship-map__retry-btn">
          重试
        </button>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="relationship-map__error">
        <p>{{ error }}</p>
        <button @click="handleReload" class="relationship-map__retry-btn">
          重新加载
        </button>
      </div>

      <!-- 空数据状态 -->
      <div v-else-if="!mapData || !mapData.nodes || mapData.nodes.length === 0" class="relationship-map__empty">
        <p>暂无关系数据</p>
        <button @click="handleReload" class="relationship-map__retry-btn">
          重新加载
        </button>
        <!-- 功能按钮 -->
        <GraphButtons
          :enable-global-graph="options.enableGlobalGraph"
          @fullscreen="safeToggleFullscreen"
          @global="bioStore.showGlobalGraph = true"
          @close="fullscreenState.isFullscreen = false"
          @reload="handleReload"
        />
      </div>

      <!-- 正常状态 -->
      <template v-else>
        <!-- 功能按钮 -->
        <GraphButtons
          :enable-global-graph="options.enableGlobalGraph"
          @fullscreen="safeToggleFullscreen"
          @global="bioStore.showGlobalGraph = true"
          @close="fullscreenState.isFullscreen = false"
          @reload="handleReload"
        />

        <!-- 关系图谱组件 -->
        <RelationGraph
          ref="graphRef"
          :key="'normal-' + canvasSize.width + '-' + canvasSize.height"
          :canvas-height="canvasSize.height"
          :canvas-width="canvasSize.width"
          :current-path="router.currentRoute.value.path"
          :data="mapData"
          @node-click="safeHandleNodeClick"
        />
      </template>
    </div>
  </div>

  <!-- 空图状态 -->
  <div v-else class="relationship-map__empty-global">
    <p>暂无关系数据可显示</p>
    <button v-if="error" @click="handleReload" class="relationship-map__retry-btn">
      重新加载
    </button>
  </div>

  <!-- 全屏模式 -->
  <div
    v-if="fullscreenState.isFullscreen"
    class="relationship-map-fullscreen"
    @click.self="fullscreenState.isFullscreen = false"
  >
    <div
      ref="fullscreenContainerRef"
      class="relationship-map-fullscreen__container"
    >
      <!-- 全屏模式功能按钮 -->
      <GraphButtons
        :enable-global-graph="options.enableGlobalGraph"
        @fullscreen="safeToggleFullscreen"
        @global="bioStore.showGlobalGraph = true"
        @close="fullscreenState.isFullscreen = false"
        @reload="handleReload"
      />

      <!-- 全屏关系图谱组件 -->
      <RelationGraph
        v-if="mapData && mapData.nodes && mapData.nodes.length > 0"
        ref="fullscreenGraphRef"
        :key="'fullscreen-' + fullscreenState.canvasSize.width + '-' + fullscreenState.canvasSize.height"
        :canvas-height="fullscreenState.canvasSize.height"
        :canvas-width="fullscreenState.canvasSize.width"
        :current-path="router.currentRoute.value.path"
        :data="mapData"
        @node-click="safeHandleNodeClick"
      />
      
      <div v-else class="relationship-map-fullscreen__loading">
        <div v-if="isLoading" class="relationship-map__spinner"></div>
        <p>{{ isLoading ? '加载关系中...' : '暂无关系数据' }}</p>
        <button v-if="error" @click="handleReload" class="relationship-map__retry-btn">
          重新加载
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 基础样式 */
.relationship-map {
  width: 100%;
  position: relative;
}

.relationship-map__debug {
  font-size: 10px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  font-family: monospace;
}

/* 加载状态样式 */
.relationship-map__loading,
.relationship-map-fullscreen__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--vp-c-text-2);
  gap: 12px;
}

.relationship-map__spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--vp-c-border);
  border-top: 2px solid var(--vp-c-brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态样式 */
.relationship-map__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--vp-c-red);
  gap: 12px;
  text-align: center;
}

/* 空状态样式 */
.relationship-map__empty,
.relationship-map__empty-global {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--vp-c-text-2);
  gap: 12px;
  text-align: center;
}

.relationship-map__empty-global {
  min-height: 200px;
}

/* 重试按钮样式 */
.relationship-map__retry-btn {
  padding: 6px 12px;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.relationship-map__retry-btn:hover {
  background: var(--vp-c-brand-dark);
}

/* 图谱容器样式 */
.relationship-map__container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  min-height: 200px;
}

.relationship-map__container--loading {
  background: var(--vp-c-bg-soft);
}

.relationship-map__container--error {
  border-color: var(--vp-c-red);
}

/* 全屏模式样式 */
.relationship-map-fullscreen {
  position: fixed;
  z-index: 1000;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.relationship-map-fullscreen__container {
  position: relative;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90%;
  height: 90%;
  border-radius: 12px;
  background-color: var(--vp-c-bg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}



  .relationship-map__toggle-btn,
   .relationship-map__container {
    width: 96%;
    border: none !important;
   }

  .relationship-map__btn--fullscreen {
    right: 24px;
  }

  canvas {
    position: relative !important;
  }

.relationship-map__toggle-btn:not(:hover),
.relationship-map:not(:hover) .graph-buttons {
  opacity: 0 !important;
}
.relationship-map:has(.graph-buttons:hover) canvas {
  filter: blur(3.3px);
}

/* 确保全屏模式下按钮始终显示 */
.relationship-map-fullscreen .graph-buttons {
  opacity: 1 !important;
  pointer-events: auto !important;
}

/* 全屏模式容器悬停时保持按钮显示 */
.relationship-map-fullscreen__container:hover .graph-buttons {
  opacity: 1 !important;
}

</style>


/* 全局样式，不受 scoped 限制 */
<style>
.vp-content:has(.relationship-map-fullscreen) {
  z-index: 9999 !important;
}
.vp-content:has(.relationship-map-fullscreen) .graph-btn--fullscreen {
  display: none;
}
.vp-content:has(.relationship-map-fullscreen) .graph-btn--close {
  display: block;
}
.vp-content:not(:has(.relationship-map-fullscreen)) .graph-btn--fullscreen {
  display: block;
}
.vp-content:not(:has(.relationship-map-fullscreen)) .graph-btn--close {
  display: none;
}
.graph-btn {
  border: none !important;
}
.aside {
  max-width: 260px !important;
}
.aside-container {
  width: 260px !important;
}
 .vp-content.has-sidebar[data-v-aff1f022] {
    padding-right: calc((100vw - var(--vp-layout-max-width)) / 10);
    padding-left: calc((100vw - var(--vp-layout-max-width)) / 10 + var(--vp-sidebar-width));
  }
</style>