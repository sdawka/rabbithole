<template>
  <div class="entry-form">
    <div class="entry-card">
      <div class="entry-header">
        <span class="entry-icon">🕳️</span>
        <h1>Rabbithole</h1>
        <p class="entry-subtitle">Follow your curiosity down the rabbit hole</p>
      </div>

      <div class="entry-fields">
        <div class="field">
          <label>What do you want to explore?</label>
          <input
            v-model="topic"
            type="text"
            placeholder="e.g. Why the QWERTY keyboard layout won..."
            autofocus
            @keydown.enter="submit"
          />
        </div>

        <div class="field">
          <label>Any context? What you know, what angle interests you...</label>
          <textarea
            v-model="context"
            placeholder="Optional — anything you already know, what sparked your curiosity, which aspect interests you most..."
            rows="4"
          />
        </div>
      </div>

      <button class="btn btn-primary btn-lg" :disabled="!topic.trim()" @click="submit">
        Start Exploring
      </button>

      <div v-if="pastWorkflows.length > 0" class="past-section">
        <div class="past-divider">
          <span>or revisit a past exploration</span>
        </div>
        <div class="past-list">
          <button
            v-for="wf in pastWorkflows"
            :key="wf.id"
            class="past-item"
            @click="$emit('load-workflow', wf.id)"
          >
            <span class="past-name">{{ wf.name }}</span>
            <span class="past-date">{{ formatDate(wf.updated_at) }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  pastWorkflows: Array<{ id: string; name: string; updated_at: string }>;
}>();

const emit = defineEmits<{
  submit: [topic: string, context: string];
  'load-workflow': [id: string];
}>();

const topic = ref('');
const context = ref('');

function submit() {
  if (!topic.value.trim()) return;
  emit('submit', topic.value.trim(), context.value.trim());
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
</script>

<style scoped>
.entry-form {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 40px;
}

.entry-card {
  width: 100%;
  max-width: 560px;
}

.entry-header {
  text-align: center;
  margin-bottom: 32px;
}

.entry-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 8px;
}

.entry-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.entry-subtitle {
  color: var(--rh-text-dim);
  font-size: 14px;
}

.entry-fields {
  margin-bottom: 20px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--rh-text-dim);
  margin-bottom: 6px;
}

.field input,
.field textarea {
  width: 100%;
  font-size: 15px;
  padding: 12px 14px;
  background: var(--rh-surface);
  border: 1px solid var(--rh-border);
  border-radius: 8px;
  color: var(--rh-text);
}

.field input:focus,
.field textarea:focus {
  border-color: var(--rh-accent);
  outline: none;
}

.field textarea {
  resize: vertical;
  line-height: 1.5;
}

.btn-lg {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
}

.past-section {
  margin-top: 32px;
}

.past-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.past-divider::before,
.past-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--rh-border);
}

.past-divider span {
  font-size: 11px;
  color: var(--rh-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.past-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.past-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid var(--rh-border);
  border-radius: 6px;
  color: var(--rh-text);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.past-item:hover {
  background: var(--rh-surface);
  border-color: var(--rh-accent);
}

.past-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.past-date {
  font-size: 11px;
  color: var(--rh-text-dim);
  flex-shrink: 0;
  margin-left: 12px;
}
</style>
