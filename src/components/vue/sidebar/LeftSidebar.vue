<template>
  <div class="left-sidebar">
    <div class="sidebar-section">
      <h3 class="sidebar-title">Workflows</h3>
      <div class="workflow-actions">
        <button class="btn btn-primary btn-sm" @click="$emit('new-from-template')">+ Template</button>
        <button class="btn btn-secondary btn-sm" @click="$emit('new-workflow')">+ Blank</button>
      </div>
      <div class="workflow-list">
        <div
          v-for="wf in workflows"
          :key="wf.id"
          class="workflow-item"
          :class="{ active: wf.id === currentWorkflowId }"
          @click="$emit('select-workflow', wf.id)"
        >
          <span class="wf-name">{{ wf.name }}</span>
          <button
            class="wf-delete"
            @click.stop="$emit('delete-workflow', wf.id)"
            title="Delete"
          >&times;</button>
        </div>
      </div>
    </div>

    <div class="sidebar-section">
      <h3 class="sidebar-title">Node Palette</h3>
      <div v-for="(catNodes, category) in categorizedNodes" :key="category" class="palette-category">
        <div class="cat-label">{{ category }}</div>
        <div
          v-for="node in catNodes"
          :key="node.type"
          class="palette-node"
          :draggable="true"
          @dragstart="onDragStart($event, node.type)"
        >
          <span class="palette-icon">{{ node.icon }}</span>
          <span class="palette-label">{{ node.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  workflows: Array<{ id: string; name: string }>;
  currentWorkflowId: string | null;
}>();

defineEmits<{
  'select-workflow': [id: string];
  'new-workflow': [];
  'new-from-template': [];
  'delete-workflow': [id: string];
}>();

const categorizedNodes = {
  Entry: [
    { type: 'topic_entry', icon: '🕳️', label: 'Topic Entry' },
    { type: 'brain_dump', icon: '🧠', label: 'Brain Dump' },
  ],
  Research: [
    { type: 'research_questions', icon: '🎯', label: 'Research Questions' },
    { type: 'source_discovery', icon: '🔍', label: 'Source Discovery' },
  ],
  Analysis: [
    { type: 'source_analysis', icon: '📖', label: 'Source Analysis' },
    { type: 'emerging_questions', icon: '❓', label: 'Emerging Questions' },
    { type: 'aha_moments', icon: '⚡', label: 'Aha Moments' },
    { type: 'key_concepts', icon: '📚', label: 'Key Concepts' },
    { type: 'key_people', icon: '🧑‍🔬', label: 'Key People' },
  ],
  Synthesis: [
    { type: 'pattern_recognition', icon: '🧵', label: 'Pattern Recognition' },
    { type: 'synthesis', icon: '🔆', label: 'Synthesis' },
    { type: 'reflection', icon: '🌫️', label: 'Reflection' },
  ],
};

function onDragStart(event: DragEvent, type: string) {
  event.dataTransfer?.setData('application/rabbithole-node', type);
  event.dataTransfer!.effectAllowed = 'move';
}
</script>

<style scoped>
.left-sidebar {
  width: 220px;
  background: var(--rh-surface);
  border-right: 1px solid var(--rh-border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-section {
  padding: 14px;
  border-bottom: 1px solid var(--rh-border);
}

.sidebar-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--rh-text-dim);
  margin-bottom: 10px;
}

.workflow-actions {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.workflow-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.workflow-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
}

.workflow-item:hover {
  background: var(--rh-surface-2);
}

.workflow-item.active {
  background: var(--rh-surface-2);
  color: var(--rh-accent);
}

.wf-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wf-delete {
  background: none;
  border: none;
  color: var(--rh-text-dim);
  font-size: 16px;
  padding: 0 4px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}

.workflow-item:hover .wf-delete {
  opacity: 1;
}

.wf-delete:hover {
  color: var(--rh-error);
}

.palette-category {
  margin-bottom: 10px;
}

.cat-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--rh-text-dim);
  margin-bottom: 4px;
  padding-left: 4px;
}

.palette-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: grab;
  font-size: 12px;
  transition: background 0.15s;
}

.palette-node:hover {
  background: var(--rh-surface-2);
}

.palette-node:active {
  cursor: grabbing;
}

.palette-icon {
  font-size: 14px;
}
</style>
