<template>
  <div class="top-toolbar">
    <div class="toolbar-left">
      <span class="logo">Rabbithole</span>
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
  background: color-mix(in srgb, var(--rh-surface) 90%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: none;
  height: 48px;
  flex-shrink: 0;
  position: relative;
}

.top-toolbar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--rh-border), transparent);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-family: var(--rh-font-display);
  font-weight: 400;
  font-size: 17px;
  font-style: italic;
  white-space: nowrap;
  color: var(--rh-text);
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
  box-shadow: 0 0 6px color-mix(in srgb, var(--rh-accent) 50%, transparent);
  animation: breathe 2s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.85); }
}
</style>
