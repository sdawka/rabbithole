<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="node" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-container">
          <div class="modal-sidebar">
            <div class="sidebar-section" v-if="upstreamNodes.length > 0">
              <div class="sidebar-label">Inputs</div>
              <button
                v-for="n in upstreamNodes"
                :key="n.id"
                class="related-node"
                :class="{ active: n.id === node.id }"
                @click="$emit('navigate', n.id)"
              >
                <span class="related-icon">{{ getTypeDef(n.node_type)?.icon ?? '?' }}</span>
                <span class="related-title">{{ n.title }}</span>
              </button>
            </div>
            <div class="sidebar-section" v-if="downstreamNodes.length > 0">
              <div class="sidebar-label">Outputs</div>
              <button
                v-for="n in downstreamNodes"
                :key="n.id"
                class="related-node"
                :class="{ active: n.id === node.id }"
                @click="$emit('navigate', n.id)"
              >
                <span class="related-icon">{{ getTypeDef(n.node_type)?.icon ?? '?' }}</span>
                <span class="related-title">{{ n.title }}</span>
              </button>
            </div>
          </div>

          <div class="modal-main">
            <div class="modal-header">
              <div class="modal-title-row">
                <span class="modal-icon">{{ getTypeDef(node.node_type)?.icon ?? '?' }}</span>
                <h2>{{ node.title }}</h2>
                <span class="modal-badge" :style="{ color: getTypeDef(node.node_type)?.color }">
                  {{ getTypeDef(node.node_type)?.label }}
                </span>
              </div>
              <button class="modal-close" @click="$emit('close')">&times;</button>
            </div>

            <div class="modal-body">
              <div v-if="node.user_input" class="modal-section">
                <div class="section-label">Input</div>
                <div class="section-content input-content">{{ node.user_input }}</div>
              </div>

              <div v-if="node.output_data" class="modal-section">
                <div class="section-label">Output</div>
                <div class="section-content output-content">{{ node.output_data }}</div>
              </div>

              <div v-if="node.error_message" class="modal-section">
                <div class="section-label error-label">Error</div>
                <div class="section-content error-content">{{ node.error_message }}</div>
              </div>

              <div v-if="!node.output_data && !node.error_message && node.status === 'idle'" class="modal-empty">
                This node hasn't been run yet.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface NodeRecord {
  id: string;
  node_type: string;
  title: string;
  user_input: string;
  output_data: string;
  error_message: string;
  status: string;
}

interface EdgeRecord {
  source_node: string;
  target_node: string;
}

interface TypeDef {
  icon: string;
  label: string;
  color: string;
}

const props = defineProps<{
  node: NodeRecord | null;
  allNodes: NodeRecord[];
  edges: EdgeRecord[];
  nodeTypes: Record<string, TypeDef>;
}>();

defineEmits<{
  close: [];
  navigate: [nodeId: string];
}>();

function getTypeDef(type: string): TypeDef | undefined {
  return props.nodeTypes[type];
}

const upstreamNodes = computed(() => {
  if (!props.node) return [];
  const sourceIds = props.edges
    .filter(e => e.target_node === props.node!.id)
    .map(e => e.source_node);
  return props.allNodes.filter(n => sourceIds.includes(n.id));
});

const downstreamNodes = computed(() => {
  if (!props.node) return [];
  const targetIds = props.edges
    .filter(e => e.source_node === props.node!.id)
    .map(e => e.target_node);
  return props.allNodes.filter(n => targetIds.includes(n.id));
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 32px;
}

.modal-container {
  display: flex;
  background: var(--rh-surface);
  border: 1px solid var(--rh-border);
  border-radius: 14px;
  width: 100%;
  max-width: 960px;
  max-height: 85vh;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.03);
  overflow: hidden;
}

/* Sidebar with related nodes */
.modal-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: var(--rh-bg);
  border-right: 1px solid var(--rh-border);
  padding: 16px 0;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 16px;
}

.sidebar-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--rh-text-dim);
  padding: 0 16px;
  margin-bottom: 6px;
}

.related-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: var(--rh-text-dim);
  cursor: pointer;
  font-size: 12px;
  text-align: left;
  transition: all 0.15s;
}

.related-node:hover {
  background: var(--rh-surface);
  color: var(--rh-text);
}

.related-node.active {
  background: var(--rh-surface-2);
  color: var(--rh-accent);
}

.related-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.related-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Main content */
.modal-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--rh-border);
  flex-shrink: 0;
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.modal-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.modal-title-row h2 {
  font-family: var(--rh-font-display);
  font-size: 20px;
  font-weight: 400;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-badge {
  font-size: 11px;
  padding: 3px 8px;
  border: 1px solid currentColor;
  border-radius: 5px;
  white-space: nowrap;
  opacity: 0.7;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--rh-border);
  border-radius: 8px;
  color: var(--rh-text-dim);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.modal-close:hover {
  background: var(--rh-surface-2);
  color: var(--rh-text);
  border-color: var(--rh-text-dim);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.modal-section {
  margin-bottom: 24px;
}

.section-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--rh-text-dim);
  margin-bottom: 8px;
}

.section-content {
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--rh-text);
}

.input-content {
  padding: 14px 16px;
  background: var(--rh-bg);
  border: 1px solid var(--rh-border);
  border-radius: 8px;
  font-size: 13px;
  color: var(--rh-text-dim);
}

.output-content {
  padding: 16px 20px;
  background: var(--rh-bg);
  border-left: 3px solid var(--rh-accent-2);
  border-radius: 4px;
}

.error-label {
  color: var(--rh-error);
}

.error-content {
  padding: 14px 16px;
  background: var(--rh-bg);
  border-left: 3px solid var(--rh-error);
  border-radius: 4px;
  color: var(--rh-error);
}

.modal-empty {
  text-align: center;
  color: var(--rh-text-dim);
  font-size: 14px;
  padding: 48px 0;
}

/* Transitions */
.modal-enter-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-leave-active {
  transition: all 0.15s ease;
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .modal-container {
  transform: scale(0.96) translateY(8px);
}
.modal-leave-to {
  opacity: 0;
}

/* Escape key hint */
@media (min-width: 768px) {
  .modal-close::after {
    content: 'esc';
    position: absolute;
    right: -32px;
    font-size: 9px;
    color: var(--rh-text-dim);
    opacity: 0;
    transition: opacity 0.15s;
  }
  .modal-close:hover::after {
    opacity: 1;
  }
}
</style>
