<!-- components/RelationGraphCanvas.vue -->
<script setup lang="ts">
import * as d3 from "d3";
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from "vue";
import type { CanvasSize, MapLink, MapNodeLink, Node } from "../../types";
import { useTheme } from "../composables/useTheme";
import { useSimulation } from "../composables/useSimulation";
import { DrawingManager } from "../composables/useDrawing";
import { EventHandlers } from "../composables/useEventHandlers";
import { PathUtils } from "../../utils/path-utils";
import { CANVAS_CONFIG } from "../../constants";

let TAG = "RelationGraph.vue";
// 日志计数器
let logCounter = 0;
function log(step: string, data?: any) {
  console.log(`${TAG} ${++logCounter}. [${step}]`, data ? data : '');
}

// 定义 emit 事件
const emit = defineEmits<{
  (e: "nodeClick", path: string): void;
}>();

const props = defineProps<{
  data: MapNodeLink | null;  // 修改：允许为 null
  currentPath?: string;
  canvasWidth: number;
  canvasHeight: number;
}>();
// 计算属性 - 修复：处理 null 数据
const effectiveData = computed(() => {
  return props.data || { nodes: [], links: [] };
});

log("组件初始化开始", { 
  propsData: props.data, 
  currentPath: props.currentPath,
  canvasSize: { width: props.canvasWidth, height: props.canvasHeight }
});

// 响应式数据
const map_data = ref<MapNodeLink>({ nodes: [], links: [] });
const canvasRef = ref<HTMLCanvasElement | null>(null);
const transform = ref(d3.zoomIdentity);
const hoveredNode = ref<Node | null>(null);
const mouseDownTime = ref(0);
const mouseDownPosition = ref({ x: 0, y: 0 });

log("响应式数据定义完成", { 
  initialMapData: map_data.value,
  hasCanvasRef: !!canvasRef.value
});

// 计算属性
const canvasSize = computed(() => {
  const size = {
    width: props.canvasWidth,
    height: props.canvasHeight,
  };
  log("canvasSize 计算属性", size);
  return size;
});

// 组合式函数
log("开始初始化组合式函数");
const { themeColors, setupThemeObserver } = useTheme();
const { simulation, initializeSimulation, updateForces } = 
  useSimulation(canvasSize.value, map_data.value);
log("组合式函数初始化完成", { 
  hasSimulation: !!simulation.value,
  themeColors: themeColors.value
});

// 数据验证和清理函数
function validateAndCleanData(data: MapNodeLink): MapNodeLink {
  log("开始数据验证和清理", { 
    inputNodes: data.nodes.length, 
    inputLinks: data.links.length 
  });

  const nodeIds = new Set(data.nodes.map(node => node.id));
  log("节点ID集合", Array.from(nodeIds));

  // 过滤无效链接（指向不存在的节点）
  const validLinks = data.links.filter(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    
    const sourceExists = nodeIds.has(sourceId);
    const targetExists = nodeIds.has(targetId);
    
    if (!sourceExists || !targetExists) {
      console.warn(`无效链接被过滤: 源节点 ${sourceId} 存在=${sourceExists}, 目标节点 ${targetId} 存在=${targetExists}`);
      return false;
    }
    
    return true;
  });

  log("链接过滤完成", { 
    原始链接数: data.links.length,
    有效链接数: validLinks.length,
    被过滤的链接数: data.links.length - validLinks.length
  });

  return {
    nodes: data.nodes,
    links: validLinks
  };
}

// 路径匹配函数（处理VuePress永久链接）
function findMatchingNode(nodes: Node[], path: string): Node | undefined {
  // 直接匹配
  let node = nodes.find(n => n.id === path || n.value.filePathRelative === path);
  if (node) return node;

  // 尝试处理VuePress永久链接：移除扩展名、处理特殊字符等
  const normalizedPath = path
    .replace(/\.md$/, '')
    .replace(/\//g, '-')
    .toLowerCase();
  
  node = nodes.find(n => {
    const nodePath = n.id.replace(/\.md$/, '').replace(/\//g, '-').toLowerCase();
    return nodePath === normalizedPath;
  });

  if (!node) {
    console.warn(`未找到匹配的节点: ${path}`, { 
      尝试的标准化路径: normalizedPath,
      可用节点: nodes.map(n => n.id) 
    });
  }

  return node;
}

// 初始化数据
function initializeMapData(data: MapNodeLink, currentPath?: string): void {
  log("initializeMapData 开始", { 
    inputData: data, 
    currentPath, 
    currentMapData: map_data.value 
  });

  if (!data) {
    console.warn("TypeError: data is undefined");
    return;
  }

  // 数据验证和清理
  const cleanedData = validateAndCleanData(data);
  const newNodes = JSON.parse(JSON.stringify(cleanedData.nodes));
  const newLinks = JSON.parse(JSON.stringify(cleanedData.links));

  log("数据深拷贝完成", { 
    nodeCount: newNodes.length, 
    linkCount: newLinks.length 
  });

  // 确保链接引用正确的节点对象（而不是ID字符串）
  const nodeMap = new Map(newNodes.map((node: { id: any; }) => [node.id, node]));
  
  const processedLinks = newLinks.map((link: { source: { id: any; }; target: { id: any; }; }) => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    
    const sourceNode = nodeMap.get(sourceId);
    const targetNode = nodeMap.get(targetId);
    
    if (!sourceNode || !targetNode) {
      console.error(`链接节点不存在: 源=${sourceId}, 目标=${targetId}`);
      return null;
    }
    
    return {
      ...link,
      source: sourceNode,
      target: targetNode
    };
  }).filter(Boolean) as MapLink[];

  log("链接处理完成", { 
    处理后的链接数: processedLinks.length 
  });

  // 计算连接数
  newNodes.forEach((node: Node) => {
    node.linkCount = processedLinks.reduce((count: number, link: MapLink) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      return count + (sourceId === node.id || targetId === node.id ? 1 : 0);
    }, 0);
  });

  log("节点连接数计算完成");

  // 标记孤立节点
  newNodes.forEach((node: Node) => {
    node.isCurrent = false;
    node.fx = null;
    node.fy = null;

    node.isIsolated = !processedLinks.some((link: MapLink) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      return sourceId === node.id || targetId === node.id;
    });

    node.x = canvasSize.value.width / 2;
    node.y = canvasSize.value.height / 2;
  });

  log("孤立节点标记完成");

  // 设置当前节点
  if (currentPath) {
    const currentNode = findMatchingNode(newNodes, currentPath);
    if (currentNode) {
      currentNode.isCurrent = true;
      log("当前节点设置", { currentNode: currentNode.id });
    } else {
      console.warn(`未找到当前路径对应的节点: ${currentPath}`);
    }
  }

  const oldMapData = map_data.value;
  map_data.value = { nodes: newNodes, links: processedLinks };
  
  log("map_data 更新完成", { 
    oldNodeCount: oldMapData.nodes.length,
    newNodeCount: map_data.value.nodes.length,
    oldLinkCount: oldMapData.links.length,
    newLinkCount: map_data.value.links.length
  });
}

// 安全的模拟器初始化函数
function initializeSimulationSafely(nodes: Node[], links: MapLink[]) {
  log("开始安全初始化模拟器", { nodes: nodes.length, links: links.length });
  
  try {
    // 再次验证数据
    const nodeIds = new Set(nodes.map(n => n.id));
    const validLinks = links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    log("模拟器初始化前的最终验证", {
      原始链接数: links.length,
      有效链接数: validLinks.length
    });

    const sim = initializeSimulation(nodes, validLinks);
    log("模拟器初始化成功");
    return sim;
  } catch (error) {
    console.error("模拟器初始化失败:", error);
    
    // 返回一个最小化的安全模拟器
    const safeSim = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(canvasSize.value.width / 2, canvasSize.value.height / 2));
    
    log("创建了安全模拟器作为备选方案");
    return safeSim;
  }
}

// 绘制函数
let drawingManager: DrawingManager | null = null;
let tickCount = 0;

function ticked(): void {
  tickCount++;
  if (tickCount <= 5) {
    log(`ticked #${tickCount}`, { 
      hasCanvas: !!canvasRef.value, 
      hasDrawingManager: !!drawingManager,
      nodeCount: map_data.value.nodes.length 
    });
  }

  if (!canvasRef.value || !drawingManager) return;
  
  const context = canvasRef.value.getContext("2d");
  if (!context) return;

  drawingManager.clearCanvas(canvasSize.value);
  drawingManager.applyTransform();
  drawingManager.drawLinks(map_data.value.links);
  drawingManager.drawNodes(map_data.value.nodes);
  drawingManager.drawLabels(map_data.value.nodes);
  drawingManager.restoreTransform();
}

// 事件处理
let eventHandlers: EventHandlers | null = null;

function setupEventListeners(): void {
  log("setupEventListeners 开始", { 
    hasCanvas: !!canvasRef.value, 
    hasSimulation: !!simulation.value 
  });

  if (!canvasRef.value || !simulation.value) return;

  const zoom = d3
    .zoom<HTMLCanvasElement, unknown>()
    .scaleExtent(CANVAS_CONFIG.zoomExtent)
    .filter((event: d3.D3ZoomEvent<HTMLCanvasElement, unknown>) => 
      eventHandlers?.filterZoomEvent(event) ?? true
    )
    .touchable(true)
    .on("zoom", (event: d3.D3ZoomEvent<HTMLCanvasElement, unknown>) => {
      transform.value = event.transform;
      if (drawingManager) {
        drawingManager.setTransform(transform.value);
      }
      ticked();
    });

  d3.select(canvasRef.value).call(zoom);

  eventHandlers = new EventHandlers(
    canvasRef.value,
    simulation.value,
    transform.value,
    map_data.value.nodes,
    map_data.value.links,
    canvasSize.value
  );

  canvasRef.value.addEventListener("mousedown", (e) => eventHandlers?.onMouseDown(e));
  
  log("事件监听设置完成");
}

// 生命周期
onMounted(() => {
  log("onMounted 开始执行");
  
  if (!canvasRef.value) {
    log("canvasRef 为空，中止挂载");
    return;
  }

  const context = canvasRef.value.getContext("2d");
  if (!context) {
    log("获取 canvas 上下文失败");
    return;
  }

  log("Canvas 上下文获取成功");

  // 初始化绘制管理器
  drawingManager = new DrawingManager(context, themeColors.value, transform.value);
  log("DrawingManager 初始化完成");

  // 初始化数据
  log("开始初始化地图数据");
  initializeMapData(effectiveData.value, props.currentPath);

  // 设置主题观察器
  const styleObserver = setupThemeObserver(ticked);
  onUnmounted(() => {
    log("组件卸载，断开主题观察器");
    styleObserver.disconnect();
  });
  log("主题观察器设置完成");

  // 安全初始化模拟器
  log("开始安全初始化模拟器");
  simulation.value = initializeSimulationSafely(map_data.value.nodes, map_data.value.links);
  simulation.value.on("tick", ticked);
  log("模拟器初始化完成", { simulation: simulation.value });

  // 设置事件监听
  log("开始设置事件监听");
  setupEventListeners();

  log("onMounted 执行完成");
});

onUnmounted(() => {
  log("onUnmounted 开始执行");
  if (simulation.value) {
    simulation.value.stop();
    log("模拟器已停止");
  }
  log("组件卸载完成");
});

// 监听器
watch(() => canvasSize.value, (newSize, oldSize) => {
  log("canvasSize 变化", { oldSize, newSize });
  updateForces();
  if (simulation.value) {
    simulation.value.alpha(0.3).restart();
    log("模拟器重启");
  }
});

// 监听器 - 修复：使用 effectiveData
watch([() => effectiveData.value, () => props.currentPath], ([newData, newPath], [oldData, oldPath]) => {
  log("数据或当前路径变化", { 
    oldData, 
    newData, 
    oldPath, 
    newPath,
    currentMapData: map_data.value
  });

  if (!newData) {
    log("新数据为空，跳过更新");
    return;
  }

  log("开始更新地图数据");
  initializeMapData(newData, newPath);
  
  if (simulation.value) {
    // 安全地更新模拟器
    simulation.value.nodes(map_data.value.nodes);
    
    try {
      simulation.value.force("link", 
        d3.forceLink(map_data.value.links)
          .id((d: any) => d.id)
          .distance(100)
      );
      
      simulation.value.alpha(1).restart();
      log("模拟器已更新并重启", { 
        nodeCount: map_data.value.nodes.length,
        linkCount: map_data.value.links.length
      });
    } catch (error) {
      console.error("更新模拟器时出错:", error);
      // 即使出错也继续运行，只是不重启模拟器
    }
  }
});


</script>

<template>
  <canvas
    ref="canvasRef"
    :width="canvasSize.width"
    :height="canvasSize.height"
    :style="{
      width: canvasSize.width + 'px',
      height: canvasSize.height + 'px',
    }"
    @click="log('canvas 点击事件')"
  ></canvas>
</template>

<style scoped>
canvas {
  border: 1px solid rgb(60, 60, 67);
  margin: 0;
  border-radius: 5px;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
