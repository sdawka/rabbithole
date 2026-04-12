<template>
  <div class="config-panel">
    <div class="config-header">
      <h1>Settings</h1>
      <a href="/" class="btn btn-secondary">Back to Editor</a>
    </div>

    <section class="config-section">
      <h2>API Keys</h2>
      <div class="field">
        <label>OpenRouter API Key</label>
        <input
          type="password"
          v-model="settings.openrouter_api_key"
          placeholder="sk-or-..."
          @blur="saveSettings"
        />
      </div>
      <div class="field">
        <label>Tavily API Key</label>
        <input
          type="password"
          v-model="settings.tavily_api_key"
          placeholder="tvly-..."
          @blur="saveSettings"
        />
      </div>
      <p v-if="saveStatus" class="save-status">{{ saveStatus }}</p>
    </section>

    <section class="config-section">
      <h2>Model Presets</h2>
      <div class="presets-list">
        <div v-for="preset in presets" :key="preset.id" class="preset-card">
          <div class="preset-info">
            <span class="preset-name">{{ preset.name }}</span>
            <span class="preset-model">{{ preset.model_id }}</span>
            <span v-if="preset.is_default" class="preset-default">Default</span>
          </div>
          <div class="preset-details">
            <span>Temp: {{ preset.temperature }}</span>
            <span>Max tokens: {{ preset.max_tokens }}</span>
          </div>
          <div class="preset-actions">
            <button class="btn btn-ghost btn-sm" @click="editPreset(preset)">Edit</button>
            <button v-if="!preset.is_default" class="btn btn-ghost btn-sm" @click="setDefault(preset.id)">Set Default</button>
            <button class="btn btn-danger btn-sm" @click="removePreset(preset.id)">Delete</button>
          </div>
        </div>
      </div>

      <div class="preset-form">
        <h3>{{ editingPreset ? 'Edit Preset' : 'Add Preset' }}</h3>
        <div class="field">
          <label>Name</label>
          <input v-model="presetForm.name" placeholder="e.g. Fast & Creative" />
        </div>
        <div class="field">
          <label>Model ID</label>
          <input v-model="presetForm.model_id" placeholder="e.g. anthropic/claude-sonnet-4" />
          <small>See <a href="https://openrouter.ai/models" target="_blank">OpenRouter Models</a></small>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Temperature</label>
            <input type="number" v-model.number="presetForm.temperature" min="0" max="2" step="0.1" />
          </div>
          <div class="field">
            <label>Max Tokens</label>
            <input type="number" v-model.number="presetForm.max_tokens" min="100" max="32000" step="100" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="savePreset">
            {{ editingPreset ? 'Update' : 'Add' }} Preset
          </button>
          <button v-if="editingPreset" class="btn btn-ghost" @click="cancelEdit">Cancel</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Preset {
  id: string;
  name: string;
  model_id: string;
  temperature: number;
  max_tokens: number;
  is_default: number;
}

const settings = ref<Record<string, string>>({
  openrouter_api_key: '',
  tavily_api_key: '',
});
const presets = ref<Preset[]>([]);
const saveStatus = ref('');
const editingPreset = ref<Preset | null>(null);
const presetForm = ref({
  name: '',
  model_id: '',
  temperature: 0.7,
  max_tokens: 2048,
});

onMounted(async () => {
  const [settingsRes, presetsRes] = await Promise.all([
    fetch('/api/config'),
    fetch('/api/config/presets'),
  ]);
  settings.value = await settingsRes.json();
  presets.value = await presetsRes.json();
});

async function saveSettings() {
  await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings.value),
  });
  saveStatus.value = 'Saved!';
  setTimeout(() => saveStatus.value = '', 2000);
}

async function savePreset() {
  if (!presetForm.value.name || !presetForm.value.model_id) return;

  if (editingPreset.value) {
    const res = await fetch('/api/config/presets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingPreset.value.id, ...presetForm.value }),
    });
    const updated = await res.json();
    const idx = presets.value.findIndex(p => p.id === updated.id);
    if (idx >= 0) presets.value[idx] = updated;
    editingPreset.value = null;
  } else {
    const res = await fetch('/api/config/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(presetForm.value),
    });
    presets.value.push(await res.json());
  }

  presetForm.value = { name: '', model_id: '', temperature: 0.7, max_tokens: 2048 };
}

function editPreset(preset: Preset) {
  editingPreset.value = preset;
  presetForm.value = {
    name: preset.name,
    model_id: preset.model_id,
    temperature: preset.temperature,
    max_tokens: preset.max_tokens,
  };
}

function cancelEdit() {
  editingPreset.value = null;
  presetForm.value = { name: '', model_id: '', temperature: 0.7, max_tokens: 2048 };
}

async function setDefault(id: string) {
  await fetch('/api/config/presets', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, is_default: 1 }),
  });
  presets.value.forEach(p => p.is_default = p.id === id ? 1 : 0);
}

async function removePreset(id: string) {
  await fetch('/api/config/presets', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  presets.value = presets.value.filter(p => p.id !== id);
}
</script>

<style scoped>
.config-panel {
  max-width: 700px;
  margin: 0 auto;
}
.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}
.config-header h1 {
  font-size: 24px;
}
.config-section {
  background: var(--rh-surface);
  border: 1px solid var(--rh-border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}
.config-section h2 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--rh-text);
}
.field {
  margin-bottom: 14px;
}
.field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--rh-text-dim);
  margin-bottom: 4px;
}
.field input, .field select {
  width: 100%;
}
.field small {
  font-size: 11px;
  color: var(--rh-text-dim);
  margin-top: 4px;
  display: block;
}
.field-row {
  display: flex;
  gap: 14px;
}
.field-row .field {
  flex: 1;
}
.save-status {
  font-size: 12px;
  color: var(--rh-success);
  margin-top: 8px;
}
.presets-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.preset-card {
  background: var(--rh-bg);
  border: 1px solid var(--rh-border);
  border-radius: 8px;
  padding: 12px 16px;
}
.preset-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.preset-name {
  font-weight: 600;
  font-size: 14px;
}
.preset-model {
  font-size: 12px;
  color: var(--rh-text-dim);
  font-family: var(--rh-font-mono);
}
.preset-default {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--rh-accent);
  color: white;
  border-radius: 4px;
  font-weight: 600;
}
.preset-details {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--rh-text-dim);
  margin-bottom: 8px;
}
.preset-actions {
  display: flex;
  gap: 8px;
}
.preset-form {
  background: var(--rh-bg);
  border: 1px solid var(--rh-border);
  border-radius: 8px;
  padding: 16px;
}
.preset-form h3 {
  font-size: 14px;
  margin-bottom: 12px;
}
.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
</style>
