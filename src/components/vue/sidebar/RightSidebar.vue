<template>
  <div class="right-sidebar">
    <div class="inspector-header">
      <span class="inspector-icon">{{ nodeTypeDef?.icon }}</span>
      <input
        class="inspector-title"
        :value="node.title"
        @change="$emit('update-node', node.id, { title: ($event.target as HTMLInputElement).value })"
      />
      <button class="btn btn-ghost btn-sm" @click="$emit('close')">&times;</button>
    </div>

    <div class="inspector-body">
      <div class="inspector-section">
        <label>Type</label>
        <div class="badge" :style="{ background: nodeTypeDef?.color + '33', color: nodeTypeDef?.color }">
          {{ nodeTypeDef?.label }}
        </div>
      </div>

      <div class="inspector-section">
        <label>Model Preset</label>
        <select
          :value="node.preset_id ?? ''"
          @change="$emit('update-node', node.id, { preset_id: ($event.target as HTMLSelectElement).value || null })"
        >
          <option value="">Default</option>
          <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }} ({{ p.model_id }})</option>
        </select>
      </div>

      <div v-if="nodeTypeDef?.userInputField" class="inspector-section">
        <label>User Input</label>
        <textarea
          :value="node.user_input"
          rows="3"
          placeholder="Enter your input..."
          @change="$emit('update-node', node.id, { user_input: ($event.target as HTMLTextAreaElement).value })"
        />
      </div>

      <div class="inspector-section">
        <label>System Prompt</label>
        <textarea
          :value="node.system_prompt"
          rows="8"
          placeholder="Default prompt template will be used..."
          class="mono"
          @change="$emit('update-node', node.id, { system_prompt: ($event.target as HTMLTextAreaElement).value })"
        />
      </div>

      <div class="inspector-section">
        <button class="btn btn-primary" style="width: 100%;" @click="$emit('run-node', node.id)">
          {{ node.status === 'running' ? 'Running...' : 'Run Node' }}
        </button>
      </div>

      <div v-if="node.output_data" class="inspector-section">
        <label>Output</label>
        <div class="output-display">{{ node.output_data }}</div>
      </div>

      <div v-if="node.error_message" class="inspector-section">
        <label style="color: var(--rh-error);">Error</label>
        <div class="output-display error">{{ node.error_message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  node: {
    id: string;
    title: string;
    node_type: string;
    preset_id: string | null;
    user_input: string;
    system_prompt: string;
    output_data: string;
    error_message: string;
    status: string;
  };
  presets: Array<{ id: string; name: string; model_id: string }>;
  nodeTypeDef: { icon: string; label: string; color: string; category: string; userInputField: boolean } | null;
}>();

defineEmits<{
  'update-node': [id: string, data: Record<string, unknown>];
  'run-node': [nodeId: string];
  'close': [];
}>();
</script>

<style scoped>
.right-sidebar {
  width: 340px;
  background: var(--rh-surface);
  border-left: 1px solid var(--rh-border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
}

.inspector-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--rh-border);
}

.inspector-icon {
  font-size: 20px;
}

.inspector-title {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--rh-text);
  font-size: 15px;
  font-weight: 600;
  padding: 4px 0;
}

.inspector-title:focus {
  border-bottom: 1px solid var(--rh-accent);
}

.inspector-body {
  padding: 14px;
}

.inspector-section {
  margin-bottom: 16px;
}

.inspector-section label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--rh-text-dim);
  margin-bottom: 6px;
}

.inspector-section select,
.inspector-section textarea {
  width: 100%;
}

.inspector-section textarea.mono {
  font-family: var(--rh-font-mono);
  font-size: 11px;
  line-height: 1.5;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.output-display {
  background: var(--rh-bg);
  border: 1px solid var(--rh-border);
  border-radius: 6px;
  padding: 10px;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.output-display.error {
  color: var(--rh-error);
  border-color: var(--rh-error);
}
</style>
