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
      <a href="https://github.com/sdawka/rabbithole" target="_blank" rel="noopener noreferrer" class="github-link" title="View on GitHub">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      </a>
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

.github-link {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rh-text-dim);
  padding: 6px;
  border-radius: 6px;
  transition: color 0.2s, background 0.2s;
}

.github-link:hover {
  color: var(--rh-text);
  background: color-mix(in srgb, var(--rh-text) 10%, transparent);
}

@keyframes breathe {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.85); }
}
</style>
