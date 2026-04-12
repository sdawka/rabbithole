<template>
  <div
    class="flow-canvas-wrapper"
    @drop="onDrop"
    @dragover.prevent
    @dragenter.prevent
  >
    <VueFlow
      ref="vueFlowRef"
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      :default-viewport="{ x: 0, y: 0, zoom: 0.8 }"
      :min-zoom="0.2"
      :max-zoom="2"
      :snap-to-grid="true"
      :snap-grid="[20, 20]"
      fit-view-on-init
      @nodes-change="$emit('nodes-change', $event)"
      @edges-change="$emit('edges-change', $event)"
      @connect="$emit('connect', $event)"
      @node-click="onNodeClick"
      @node-double-click="onNodeDblClick"
      @pane-click="$emit('node-select', null)"
    >
      <MiniMap />
      <Controls />
      <Background :gap="20" :size="1" />
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { markRaw, watch, nextTick } from 'vue';
import { VueFlow, useVueFlow, type Node as VFNode, type Edge as VFEdge } from '@vue-flow/core';
import { MiniMap } from '@vue-flow/minimap';
import { Controls } from '@vue-flow/controls';
import { Background } from '@vue-flow/background';
import RabbitholeNode from '../nodes/RabbitholeNode.vue';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/minimap/dist/style.css';
import '@vue-flow/controls/dist/style.css';

const props = defineProps<{
  nodes: VFNode[];
  edges: VFEdge[];
  selectedNodeId: string | null;
}>();

const emit = defineEmits<{
  'nodes-change': [changes: any[]];
  'edges-change': [changes: any[]];
  'connect': [params: any];
  'node-select': [nodeId: string | null];
  'node-dblclick': [nodeId: string];
  'drop-node': [type: string, position: { x: number; y: number }];
}>();

const { screenToFlowCoordinate, fitView } = useVueFlow();

const nodeTypes = {
  rabbithole: markRaw(RabbitholeNode),
};

// Fit view when nodes first appear (loading a workflow or SSE stream starts)
let hasFitted = false;
watch(() => props.nodes.length, (newLen, oldLen) => {
  if (newLen > 0 && oldLen === 0) {
    hasFitted = false;
  }
  if (newLen > 0 && !hasFitted) {
    hasFitted = true;
    nextTick(() => {
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
    });
  }
});

function onNodeClick(_event: MouseEvent, node: VFNode) {
  emit('node-select', node.id);
}

function onNodeDblClick(_event: MouseEvent, node: VFNode) {
  emit('node-dblclick', node.id);
}

function onDrop(event: DragEvent) {
  const type = event.dataTransfer?.getData('application/rabbithole-node');
  if (!type) return;

  const position = screenToFlowCoordinate({
    x: event.clientX,
    y: event.clientY,
  });

  emit('drop-node', type, position);
}
</script>

<style scoped>
.flow-canvas-wrapper {
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
