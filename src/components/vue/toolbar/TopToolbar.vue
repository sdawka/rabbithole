<template>
  <div class="top-toolbar">
    <div class="toolbar-left">
      <span class="logo">🕳️ Rabbithole</span>
      <template v-if="workflow">
        <span class="toolbar-sep">|</span>
        <span class="workflow-name">{{ workflow.name }}</span>
      </template>
    </div>
    <div class="toolbar-right">
      <div v-if="isExploring" class="exploring-status">
        <span class="exploring-dot"></span>
        <span>{{ layerDescription || 'Exploring...' }}</span>
      </div>
      <button v-if="workflow && !isExploring" class="btn btn-primary btn-sm" @click="$emit('new-exploration')">
        New Exploration
      </button>
      <button class="btn btn-ghost btn-sm" @click="$emit('settings')">Settings</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  workflow: { name: string } | null;
  isExploring: boolean;
  layerDescription: string;
}>();

defineEmits<{
  'new-exploration': [];
  'settings': [];
}>();
</script>

<style scoped>
.top-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--rh-surface);
  border-bottom: 1px solid var(--rh-border);
  height: 48px;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-weight: 700;
  font-size: 15px;
  white-space: nowrap;
}

.toolbar-sep {
  color: var(--rh-border);
}

.workflow-name {
  font-size: 14px;
  color: var(--rh-text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.exploring-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--rh-accent);
}

.exploring-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--rh-accent);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
