<template>
  <div
    class="rh-node"
    :class="[`cat-${data.typeDef?.category ?? 'entry'}`, `status-${data.status ?? 'idle'}`, { selected: selected, branched: !!data.branchColor }]"
    :style="data.branchColor ? { '--branch-color': data.branchColor } : {}"
  >
    <div class="rh-node-header">
      <span class="icon">{{ data.typeDef?.icon ?? '?' }}</span>
      <span class="title">{{ data.title }}</span>
      <button
        v-if="data.status !== 'running'"
        class="play-btn"
        title="Continue from here"
        @click.stop="onPlayClick"
        @mousedown.stop
      >
        ▶
      </button>
      <span v-else class="running-indicator"></span>
    </div>

    <div v-if="data.typeDef?.userInputField && data.status !== 'done'" class="rh-node-input">
      <textarea
        ref="textareaRef"
        v-model="localInput"
        placeholder="Enter your input..."
        rows="1"
        @mousedown.stop
        @input="onInput"
      />
    </div>

    <div v-if="data.output_data && data.status === 'done'" class="rh-node-output-preview">
      {{ data.output_data }}
    </div>

    <div v-if="data.error_message && data.status === 'error'" class="rh-node-output-preview" style="color: var(--rh-error);">
      {{ data.error_message }}
    </div>

    <div class="rh-node-status" :class="`status-${data.status ?? 'idle'}`">
      <span class="status-dot"></span>
      <span>{{ statusLabel }}</span>
    </div>

    <!-- Input handles (left) -->
    <Handle
      v-for="input in (data.typeDef?.inputs ?? [])"
      :key="`in-${input.name}`"
      type="target"
      :id="input.name"
      :position="Position.Left"
      :style="handleStyleV(input.name, 'input')"
    />

    <!-- Output handles (right) -->
    <Handle
      v-for="output in (data.typeDef?.outputs ?? [])"
      :key="`out-${output.name}`"
      type="source"
      :id="output.name"
      :position="Position.Right"
      :style="handleStyleV(output.name, 'output')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue';
import { Handle, Position, useNode } from '@vue-flow/core';

const { node } = useNode();
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const props = defineProps<{
  data: {
    id: string;
    node_type: string;
    title: string;
    status: string;
    user_input: string;
    output_data: string;
    error_message: string;
    typeDef: {
      icon: string;
      label: string;
      color: string;
      category: string;
      userInputField: boolean;
      inputs: Array<{ name: string; label: string }>;
      outputs: Array<{ name: string; label: string }>;
    } | null;
  };
  selected?: boolean;
}>();

const localInput = ref(props.data.user_input ?? '');

watch(() => props.data.user_input, (v) => {
  if (v !== localInput.value) localInput.value = v ?? '';
});

function autoResize() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

onMounted(() => nextTick(autoResize));
watch(localInput, () => nextTick(autoResize));

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function onInput() {
  // Update VueFlow node data immediately so parent sees it
  node.data = { ...node.data, user_input: localInput.value };

  // Debounced persist to API
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fetch(`/api/nodes/${props.data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_input: localInput.value }),
    });
  }, 500);
}

const statusLabel = computed(() => {
  const s = props.data.status ?? 'idle';
  return { idle: 'Ready', running: 'Running...', done: 'Complete', error: 'Error' }[s] ?? s;
});

function onPlayClick() {
  // Emit custom event that bubbles up to FlowCanvas
  const event = new CustomEvent('rh-run-from', {
    bubbles: true,
    detail: { nodeId: props.data.id },
  });
  document.dispatchEvent(event);
}

function handleStyleV(name: string, type: 'input' | 'output'): Record<string, string> {
  const handles = type === 'input' ? (props.data.typeDef?.inputs ?? []) : (props.data.typeDef?.outputs ?? []);
  const idx = handles.findIndex(h => h.name === name);
  const total = handles.length;
  // Spread handles evenly down the node height, starting after header (~37px)
  const startPx = 37;
  const spacingPx = 22;
  const top = startPx + idx * spacingPx;
  // For single handle, center it
  if (total === 1) return { top: `${startPx}px` };
  return { top: `${top}px` };
}
</script>
