<template>
  <div class="entry-form">
    <div class="entry-card">
      <div class="entry-header">
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
  position: relative;
}

.entry-form::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, color-mix(in srgb, var(--rh-accent) 8%, transparent) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.entry-card {
  width: 100%;
  max-width: 560px;
  position: relative;
  z-index: 1;
}

.entry-header {
  text-align: center;
  margin-bottom: 36px;
  animation: fadeInUp 0.6s ease both;
}

.entry-header h1 {
  font-family: var(--rh-font-display);
  font-size: 42px;
  font-weight: 400;
  font-style: italic;
  margin-bottom: 8px;
  text-shadow: 0 0 30px color-mix(in srgb, var(--rh-accent) 40%, transparent);
}

.entry-subtitle {
  color: var(--rh-text-dim);
  font-size: 16px;
  letter-spacing: 0.2px;
}

.entry-fields {
  margin-bottom: 20px;
  animation: fadeInUp 0.6s ease 0.15s both;
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
  background: color-mix(in srgb, var(--rh-surface) 85%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--rh-border);
  border-radius: 8px;
  color: var(--rh-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field input:focus,
.field textarea:focus {
  border-color: var(--rh-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--rh-accent) 10%, transparent);
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
  background: linear-gradient(135deg, var(--rh-accent), color-mix(in srgb, var(--rh-accent) 85%, #ff8800));
  border: none;
  transition: box-shadow 0.25s, transform 0.15s;
  animation: fadeInUp 0.6s ease 0.3s both;
}

.btn-lg:hover:not(:disabled) {
  box-shadow: 0 4px 20px color-mix(in srgb, var(--rh-accent) 35%, transparent);
  transform: translateY(-1px);
}

.btn-lg:active:not(:disabled) {
  transform: translateY(0);
}

.past-section {
  margin-top: 32px;
  animation: fadeInUp 0.6s ease 0.45s both;
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
  gap: 6px;
}

.past-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--rh-surface);
  border: 1px solid var(--rh-border);
  border-radius: 8px;
  color: var(--rh-text);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.past-item:hover {
  background: var(--rh-surface-2);
  border-color: color-mix(in srgb, var(--rh-accent) 40%, var(--rh-border));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
