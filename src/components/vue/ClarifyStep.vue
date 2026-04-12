<template>
  <div class="clarify-step">
    <div class="clarify-card">
      <div class="clarify-header">
        <span class="clarify-icon">🎯</span>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

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

onMounted(() => {
  // Pre-select all angles
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
  // Force reactivity
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
}

.clarify-header {
  text-align: center;
  margin-bottom: 24px;
}

.clarify-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 8px;
}

.clarify-header h2 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}

.clarify-summary {
  color: var(--rh-text-dim);
  font-size: 14px;
  line-height: 1.5;
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
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.angle-item:hover {
  border-color: var(--rh-text-dim);
}

.angle-item.checked {
  border-color: var(--rh-accent);
  background: color-mix(in srgb, var(--rh-accent) 8%, var(--rh-surface));
}

.angle-item input[type="checkbox"] {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  accent-color: var(--rh-accent);
}

.angle-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.angle-label {
  font-size: 14px;
  font-weight: 600;
}

.angle-desc {
  font-size: 12px;
  color: var(--rh-text-dim);
  line-height: 1.4;
}

.clarify-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.btn-lg {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
}
</style>
