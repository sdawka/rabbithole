<template>
  <div class="clarify-step">
    <div class="clarify-card">
      <!-- Loading state -->
      <div v-if="angles.length === 0" class="clarify-loading">
        <div class="loading-spinner"></div>
        <h2>Thinking about your topic...</h2>
        <p class="loading-subtitle">{{ summary }}</p>
      </div>

      <!-- Loaded state -->
      <template v-else>
        <div class="clarify-header">
          <h2>Let's focus your exploration</h2>
          <p class="clarify-summary">{{ summary }}</p>
        </div>

        <div class="angles-list">
          <label
            v-for="angle in angles"
            :key="angle.id"
            class="angle-item"
            :class="{ checked: selected.has(angle.id) }"
          >
            <input
              type="checkbox"
              :checked="selected.has(angle.id)"
              @change="toggleAngle(angle.id)"
            />
            <div class="angle-content">
              <span class="angle-label">{{ angle.label }}</span>
              <span class="angle-desc">{{ angle.description }}</span>
            </div>
          </label>
        </div>

        <div class="clarify-actions">
          <button class="btn btn-primary btn-lg" :disabled="selected.size === 0" @click="confirm">
            Go — explore these angles
          </button>
          <button class="btn btn-ghost" @click="$emit('back')">Back</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

interface Angle {
  id: string;
  label: string;
  description: string;
}

const props = defineProps<{
  summary: string;
  angles: Angle[];
}>();

const emit = defineEmits<{
  confirm: [angles: string[]];
  back: [];
}>();

const selected = ref(new Set<string>());

// Pre-select all angles when they arrive
watch(() => props.angles, (newAngles) => {
  if (newAngles.length > 0 && selected.value.size === 0) {
    for (const angle of newAngles) {
      selected.value.add(angle.id);
    }
    selected.value = new Set(selected.value);
  }
});

onMounted(() => {
  for (const angle of props.angles) {
    selected.value.add(angle.id);
  }
});

function toggleAngle(id: string) {
  if (selected.value.has(id)) {
    selected.value.delete(id);
  } else {
    selected.value.add(id);
  }
  selected.value = new Set(selected.value);
}

function confirm() {
  const angleLabels = props.angles
    .filter(a => selected.value.has(a.id))
    .map(a => a.label);
  emit('confirm', angleLabels);
}
</script>

<style scoped>
.clarify-step {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 40px;
}

.clarify-card {
  width: 100%;
  max-width: 560px;
  animation: clarifyFadeIn 0.5s ease both;
}

/* Loading state */
.clarify-loading {
  text-align: center;
  padding: 40px 0;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--rh-border);
  border-top-color: var(--rh-accent);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin: 0 auto 20px;
}

.clarify-loading h2 {
  font-family: var(--rh-font-display);
  font-size: 24px;
  font-weight: 400;
  font-style: italic;
  margin-bottom: 8px;
  animation: breathe 2s ease-in-out infinite;
}

.loading-subtitle {
  color: var(--rh-text-dim);
  font-size: 14px;
}

/* Loaded state */
.clarify-header {
  text-align: center;
  margin-bottom: 28px;
}

.clarify-header h2 {
  font-family: var(--rh-font-display);
  font-size: 26px;
  font-weight: 400;
  font-style: italic;
  margin-bottom: 10px;
}

.clarify-summary {
  color: var(--rh-text-dim);
  font-size: 14px;
  line-height: 1.6;
}

.angles-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.angle-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: var(--rh-surface);
  border: 1px solid var(--rh-border);
  border-left: 3px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  animation: angleSlideIn 0.4s ease both;
}

.angle-item:nth-child(1) { animation-delay: 0.1s; }
.angle-item:nth-child(2) { animation-delay: 0.15s; }
.angle-item:nth-child(3) { animation-delay: 0.2s; }
.angle-item:nth-child(4) { animation-delay: 0.25s; }
.angle-item:nth-child(5) { animation-delay: 0.3s; }
.angle-item:nth-child(6) { animation-delay: 0.35s; }

.angle-item:hover {
  border-color: var(--rh-text-dim);
  border-left-color: var(--rh-text-dim);
}

.angle-item.checked {
  border-color: var(--rh-border);
  border-left-color: var(--rh-accent-2);
  background: color-mix(in srgb, var(--rh-accent-2) 5%, var(--rh-surface));
}

.angle-item input[type="checkbox"] {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  accent-color: var(--rh-accent-2);
}

.angle-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.angle-label {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.1px;
}

.angle-desc {
  font-size: 12px;
  color: var(--rh-text-dim);
  line-height: 1.5;
}

.clarify-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  animation: clarifyFadeIn 0.5s ease 0.35s both;
}

.btn-lg {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
}

@keyframes clarifyFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes angleSlideIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
