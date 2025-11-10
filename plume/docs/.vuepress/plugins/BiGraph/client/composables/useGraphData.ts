// composables/useGraphData.ts

import { ref, computed, onMounted, onUnmounted } from "vue";
import { usePageData, usePageFrontmatter } from "vuepress/client";
import { useRouter } from "vue-router";
import type { MapNodeLink, Node, MapLink } from "../../types";
import { getGraphData } from "../../utils/graph-data";

// 日志计数器
let logCounter = 0;
function log(step: string, data?: any) {
  console.log(`${++logCounter}. [useGraphData] ${step}`, data ? data : '');
}

/**
 * 图谱数据管理
 */
export function useGraphData() {
  log("开始初始化 useGraphData");
  
  const router = useRouter();
  const page = usePageData();
  const frontmatter = usePageFrontmatter();
  
  const mapData = ref<MapNodeLink>({ nodes: [], links: [] });
  const isLoading = ref(true);
  const error = ref<string | null>(null);
  const retryCount = ref(0);
  const maxRetries = 3;

  /**
   * 加载图谱数据
   */
  const loadGraphData = async (): Promise<void> => {
    log("开始加载图谱数据", { 
      当前路径: page.value.path,
      重试次数: retryCount.value 
    });
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const data = await getGraphData(page.value.path);
      
      log("图谱数据加载成功", {
        节点数: data?.nodes?.length || 0,
        链接数: data?.links?.length || 0
      });
      
      if (data && data.nodes && data.links) {
        mapData.value = data;
        error.value = null;
      } else {
        throw new Error("获取的数据格式不正确");
      }
    } catch (err) {
      error.value = `加载关系数据失败: ${err}`;
      console.error("加载图谱数据失败:", err);
      
      // 重试逻辑
      if (retryCount.value < maxRetries) {
        retryCount.value++;
        log(`准备重试 (${retryCount.value}/${maxRetries})`, { 延迟: 1000 * retryCount.value });
        setTimeout(() => loadGraphData(), 1000 * retryCount.value);
      } else {
        // 设置空数据而不是保持加载状态
        mapData.value = { nodes: [], links: [] };
        log("达到最大重试次数，设置空数据");
      }
    } finally {
      isLoading.value = false;
      log("图谱数据加载完成", { 
        是否成功: !error.value,
        数据状态: mapData.value 
      });
    }
  };

  /**
   * 处理节点点击
   */
  const handleNodeClick = (path: string): void => {
    log("处理节点点击", { 路径: path });
    try {
      if (path && path !== router.currentRoute.value.path) {
        router.push(path);
        log("路由跳转完成");
      } else {
        log("点击的是当前节点或路径无效");
      }
    } catch (err) {
      console.error("节点点击处理失败:", err);
      error.value = `导航失败: ${err}`;
    }
  };

  /**
   * 是否应该折叠空图谱
   */
  const shouldFoldEmptyGraph = computed(() => {
    const hasData = mapData.value.nodes && mapData.value.nodes.length > 0;
    const shouldShow = frontmatter.value.localGraph !== false;
    
    log("检查是否应该折叠空图谱", {
      有数据: hasData,
      应该显示: shouldShow,
      节点数: mapData.value.nodes?.length || 0
    });
    
    return hasData || shouldShow;
  });

  /**
   * 重新加载数据
   */
  const reloadData = (): void => {
    log("手动重新加载数据");
    retryCount.value = 0;
    loadGraphData();
  };

  onMounted(() => {
    log("useGraphData onMounted 开始");
    loadGraphData();
  });

  // 监听路由变化重新加载数据
  const unwatch = router.afterEach((to, from) => {
    if (to.path !== from.path) {
      log("路由变化，重新加载数据", { 
        从: from.path, 
        到: to.path 
      });
      retryCount.value = 0;
      loadGraphData();
    }
  });

  onUnmounted(() => {
    log("useGraphData onUnmounted");
    unwatch();
  });

  log("useGraphData 初始化完成");

  return {
    mapData,
    isLoading,
    error,
    handleNodeClick,
    shouldFoldEmptyGraph,
    reloadData,
  };
}