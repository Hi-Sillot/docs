// composables/useSimulation.ts - 力导向图模拟

import * as d3 from "d3";
import { ref, computed } from "vue";
import type { Node, MapLink, MapNodeLink, CanvasSize } from "../../types";
import { FORCE_CONFIG } from "../../constants";

/**
 * 力导向图模拟管理
 */
export function useSimulation(canvasSize: CanvasSize, data: MapNodeLink) {
  const simulation = ref<d3.Simulation<Node, MapLink> | null>(null);

  function initializeSimulation(nodes: Node[], links: MapLink[]): d3.Simulation<Node, MapLink> {
    const centerForce = d3
      .forceCenter<Node>(canvasSize.width / 2, canvasSize.height / 2)
      .strength(0.002);

    return d3
      .forceSimulation<Node>(nodes)
      .force("link", FORCE_CONFIG.link.links(links))
      .force("charge", FORCE_CONFIG.charge)
      .force("collision", FORCE_CONFIG.collision)
      .force("center", centerForce)
      .force("x", FORCE_CONFIG.x.x(canvasSize.width / 2))
      .force("y", FORCE_CONFIG.y.y(canvasSize.height / 2))
      .alphaDecay(FORCE_CONFIG.simulation.alphaDecay)
      .alphaMin(FORCE_CONFIG.simulation.alphaMin)
      .velocityDecay(FORCE_CONFIG.simulation.velocityDecay);
  }

  function restartSimulation(): void {
    if (simulation.value) {
      simulation.value
        .alpha(FORCE_CONFIG.simulation.restart.alpha)
        .alphaTarget(FORCE_CONFIG.simulation.restart.alphaTarget)
        .restart();
    }
  }

  function updateForces(): void {
    if (!simulation.value) return;

    const centerForce = d3
      .forceCenter<Node>(canvasSize.width / 2, canvasSize.height / 2)
      .strength(0.002);

    simulation.value
      .force("center", centerForce)
      .force("x", FORCE_CONFIG.x.x(canvasSize.width / 2))
      .force("y", FORCE_CONFIG.y.y(canvasSize.height / 2));
  }

  return {
    simulation,
    initializeSimulation,
    restartSimulation,
    updateForces,
  };
}