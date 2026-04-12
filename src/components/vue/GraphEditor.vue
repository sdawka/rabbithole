<template>
  <div class="editor-layout">
    <TopToolbar
      v-if="state !== 'entry' && state !== 'clarifying-loading'"
      :workflow="currentWorkflow"
      :isExploring="state === 'exploring'"
      :layerDescription="layerDescription"
      @new-exploration="resetToEntry"
      @settings="goToSettings"
    />

    <!-- Progress bar -->
    <div v-if="state === 'exploring'" class="progress-bar-container">
      <div class="progress-bar" :style="{ width: `${(currentLayer / totalLayers) * 100}%` }"></div>
    </div>

    <div class="editor-body">
      <!-- ENTRY STATE -->
      <EntryForm
        v-if="state === 'entry' || state === 'clarifying-loading'"
        :pastWorkflows="workflows"
        :loading="state === 'clarifying-loading'"
        @submit="onTopicSubmit"
        @load-workflow="loadWorkflow"
      />

      <!-- CLARIFYING STATE -->
      <ClarifyStep
        v-if="state === 'clarifying'"
        :summary="clarifySummary"
        :angles="clarifyAngles"
        @confirm="onAnglesConfirmed"
        @back="state = 'entry'"
      />

      <!-- EXPLORING / BROWSING STATE -->
      <template v-if="state === 'exploring' || state === 'browsing'">
        <div class="canvas-container">
          <FlowCanvas
            :nodes="flowNodes"
            :edges="flowEdges"
            :selectedNodeId="selectedNodeId"
            @node-select="selectNode"
            @nodes-change="onNodesChange"
            @edges-change="onEdgesChange"
            @connect="onConnect"
            @drop-node="onDropNode"
          />

          <!-- Floating status toast -->
          <Transition name="toast">
            <div v-if="state === 'exploring' && layerDescription" class="explore-toast">
              <span class="toast-spinner"></span>
              <span class="toast-text">{{ layerDescription }}</span>
              <span class="toast-layer">{{ currentLayer }} / {{ totalLayers }}</span>
            </div>
          </Transition>
        </div>

        <RightSidebar
          v-if="selectedNode"
          :node="selectedNode"
          :presets="presets"
          :nodeTypeDef="selectedNodeTypeDef"
          @update-node="onUpdateNode"
          @run-node="onRunNode"
          @close="selectedNodeId = null"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import EntryForm from './EntryForm.vue';
import ClarifyStep from './ClarifyStep.vue';
import RightSidebar from './sidebar/RightSidebar.vue';
import TopToolbar from './toolbar/TopToolbar.vue';
import FlowCanvas from './canvas/FlowCanvas.vue';

interface NodeRecord {
  id: string;
  workflow_id: string;
  node_type: string;
  title: string;
  position_x: number;
  position_y: number;
  width: number;
  preset_id: string | null;
  system_prompt: string;
  user_input: string;
  output_data: string;
  status: string;
  error_message: string;
}

interface EdgeRecord {
  id: string;
  workflow_id: string;
  source_node: string;
  target_node: string;
  source_handle: string;
  target_handle: string;
}

interface Workflow {
  id: string;
  name: string;
  updated_at?: string;
  nodes?: NodeRecord[];
  edges?: EdgeRecord[];
}

interface Preset {
  id: string;
  name: string;
  model_id: string;
  temperature: number;
  max_tokens: number;
  is_default: number;
}

const nodeTypeRegistry: Record<string, { label: string; icon: string; color: string; category: string; userInputField: boolean; inputs: Array<{ name: string; label: string }>; outputs: Array<{ name: string; label: string }> }> = {
  topic_entry: { label: 'Topic Entry', icon: '🕳️', color: '#e94560', category: 'entry', userInputField: true, inputs: [], outputs: [{ name: 'topic', label: 'Topic' }] },
  brain_dump: { label: 'Brain Dump', icon: '🧠', color: '#e94560', category: 'entry', userInputField: true, inputs: [{ name: 'topic', label: 'Topic' }], outputs: [{ name: 'knowledge_dump', label: 'Knowledge Dump' }] },
  research_questions: { label: 'Research Questions', icon: '🎯', color: '#3b82f6', category: 'research', userInputField: false, inputs: [{ name: 'topic', label: 'Topic' }, { name: 'knowledge_dump', label: 'Knowledge Dump' }], outputs: [{ name: 'questions', label: 'Questions' }] },
  source_discovery: { label: 'Source Discovery', icon: '🔍', color: '#3b82f6', category: 'research', userInputField: false, inputs: [{ name: 'topic', label: 'Topic' }, { name: 'questions', label: 'Questions' }], outputs: [{ name: 'sources', label: 'Sources' }] },
  source_analysis: { label: 'Source Analysis', icon: '📖', color: '#8b5cf6', category: 'analysis', userInputField: false, inputs: [{ name: 'topic', label: 'Topic' }, { name: 'sources', label: 'Sources' }], outputs: [{ name: 'insights', label: 'Insights' }, { name: 'new_questions', label: 'New Questions' }] },
  emerging_questions: { label: 'Emerging Questions', icon: '❓', color: '#8b5cf6', category: 'analysis', userInputField: false, inputs: [{ name: 'topic', label: 'Topic' }, { name: 'new_questions', label: 'New Questions' }], outputs: [{ name: 'prioritized_questions', label: 'Prioritized Questions' }] },
  aha_moments: { label: 'Aha Moments', icon: '⚡', color: '#8b5cf6', category: 'analysis', userInputField: false, inputs: [{ name: 'topic', label: 'Topic' }, { name: 'insights', label: 'Insights' }], outputs: [{ name: 'aha_findings', label: 'Aha Findings' }] },
  key_concepts: { label: 'Key Concepts', icon: '📚', color: '#8b5cf6', category: 'analysis', userInputField: false, inputs: [{ name: 'topic', label: 'Topic' }, { name: 'insights', label: 'Insights' }], outputs: [{ name: 'concepts', label: 'Concepts' }] },
  key_people: { label: 'Key People', icon: '🧑‍🔬', color: '#8b5cf6', category: 'analysis', userInputField: false, inputs: [{ name: 'topic', label: 'Topic' }, { name: 'insights', label: 'Insights' }], outputs: [{ name: 'people', label: 'People' }] },
  pattern_recognition: { label: 'Pattern Recognition', icon: '🧵', color: '#f59e0b', category: 'synthesis', userInputField: false, inputs: [{ name: 'topic', label: 'Topic' }, { name: 'insights', label: 'Insights' }, { name: 'concepts', label: 'Concepts' }], outputs: [{ name: 'patterns', label: 'Patterns' }] },
  synthesis: { label: 'Synthesis', icon: '🔆', color: '#f59e0b', category: 'synthesis', userInputField: false, inputs: [{ name: 'topic', label: 'Topic' }, { name: 'patterns', label: 'Patterns' }, { name: 'aha_findings', label: 'Aha Findings' }, { name: 'concepts', label: 'Concepts' }, { name: 'people', label: 'People' }], outputs: [{ name: 'summary', label: 'Summary' }] },
  reflection: { label: 'Reflection', icon: '🌫️', color: '#f59e0b', category: 'synthesis', userInputField: true, inputs: [{ name: 'topic', label: 'Topic' }, { name: 'summary', label: 'Summary' }], outputs: [{ name: 'reflection', label: 'Reflection' }] },
};

// State machine
type AppState = 'entry' | 'clarifying-loading' | 'clarifying' | 'exploring' | 'browsing';
const state = ref<AppState>('entry');

// Data
const workflows = ref<Workflow[]>([]);
const currentWorkflow = ref<Workflow | null>(null);
const nodes = ref<NodeRecord[]>([]);
const edges = ref<EdgeRecord[]>([]);
const selectedNodeId = ref<string | null>(null);
const presets = ref<Preset[]>([]);
const layerDescription = ref('');
const currentLayer = ref(0);
const totalLayers = ref(7);

// Clarify state
const currentTopic = ref('');
const currentContext = ref('');
const clarifySummary = ref('');
const clarifyAngles = ref<Array<{ id: string; label: string; description: string }>>([]);

// Computed
const selectedNode = computed(() => nodes.value.find(n => n.id === selectedNodeId.value) ?? null);
const selectedNodeTypeDef = computed(() => selectedNode.value ? nodeTypeRegistry[selectedNode.value.node_type] : null);

const flowNodes = computed(() =>
  nodes.value.map(n => {
    const typeDef = nodeTypeRegistry[n.node_type];
    return {
      id: n.id,
      type: 'rabbithole',
      position: { x: n.position_x, y: n.position_y },
      data: { ...n, typeDef },
    };
  })
);

const flowEdges = computed(() =>
  edges.value.map(e => ({
    id: e.id,
    source: e.source_node,
    target: e.target_node,
    sourceHandle: e.source_handle,
    targetHandle: e.target_handle,
    animated: nodes.value.find(n => n.id === e.source_node)?.status === 'running',
  }))
);

onMounted(async () => {
  const [wfRes, presetRes] = await Promise.all([
    fetch('/api/workflows'),
    fetch('/api/config/presets'),
  ]);
  workflows.value = await wfRes.json();
  presets.value = await presetRes.json();
});

// ---- State transitions ----

async function onTopicSubmit(topic: string, context: string) {
  currentTopic.value = topic;
  currentContext.value = context;
  state.value = 'clarifying-loading';
  clarifySummary.value = '';
  clarifyAngles.value = [];

  try {
    const res = await fetch('/api/explore/clarify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, context }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    clarifySummary.value = data.summary;
    clarifyAngles.value = data.angles;
  } catch (err) {
    clarifySummary.value = `Exploring: ${topic}`;
    clarifyAngles.value = [
      { id: 'history', label: 'Historical origins', description: 'How did this come to be?' },
      { id: 'controversy', label: 'Key controversies', description: 'What do people disagree about?' },
      { id: 'people', label: 'Key figures', description: 'Who are the important people?' },
      { id: 'practical', label: 'Practical implications', description: 'How does this affect real life?' },
    ];
  }
  state.value = 'clarifying';
}

async function onAnglesConfirmed(angles: string[]) {
  state.value = 'exploring';
  nodes.value = [];
  edges.value = [];
  selectedNodeId.value = null;
  layerDescription.value = 'Starting exploration...';
  currentLayer.value = 0;

  try {
    const res = await fetch('/api/explore/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: currentTopic.value,
        context: currentContext.value,
        angles,
      }),
    });

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          handleSSEEvent(data);
        } catch { /* skip malformed events */ }
      }
    }
  } catch (err) {
    console.error('Explore error:', err);
  } finally {
    state.value = 'browsing';
    layerDescription.value = '';
    // Reload full workflow to get complete data
    if (currentWorkflow.value) {
      await loadWorkflow(currentWorkflow.value.id);
    }
  }
}

function handleSSEEvent(data: Record<string, any>) {
  switch (data.type) {
    case 'workflow_created':
      currentWorkflow.value = { id: data.workflowId, name: currentTopic.value };
      break;

    case 'layer_start':
      layerDescription.value = data.description ?? '';
      if (data.layer) currentLayer.value = data.layer;
      break;

    case 'planning':
      layerDescription.value = data.description ?? 'Planning next steps...';
      break;

    case 'layer_complete':
      if (data.layer) currentLayer.value = data.layer;
      break;

    case 'node_created':
      nodes.value.push({
        id: data.nodeId,
        workflow_id: currentWorkflow.value?.id ?? '',
        node_type: data.nodeType,
        title: data.title,
        position_x: data.position.x,
        position_y: data.position.y,
        width: 280,
        preset_id: null,
        system_prompt: '',
        user_input: data.data?.user_input ?? '',
        output_data: '',
        status: 'idle',
        error_message: '',
      });
      break;

    case 'edge_created':
      edges.value.push({
        id: data.edgeId,
        workflow_id: currentWorkflow.value?.id ?? '',
        source_node: data.source,
        target_node: data.target,
        source_handle: data.sourceHandle,
        target_handle: data.targetHandle,
      });
      break;

    case 'node_start': {
      const node = nodes.value.find(n => n.id === data.nodeId);
      if (node) node.status = 'running';
      break;
    }

    case 'node_complete': {
      const node = nodes.value.find(n => n.id === data.nodeId);
      if (node) {
        node.status = data.status;
        node.output_data = data.output ?? '';
        node.error_message = data.error ?? '';
      }
      break;
    }

    case 'explore_complete':
      currentLayer.value = totalLayers.value;
      break;

    case 'explore_error':
      console.error('Explore error:', data.error);
      break;
  }
}

async function loadWorkflow(id: string) {
  const res = await fetch(`/api/workflows/${id}`);
  const wf = await res.json();
  currentWorkflow.value = wf;
  nodes.value = wf.nodes ?? [];
  edges.value = wf.edges ?? [];
  selectedNodeId.value = null;
  state.value = 'browsing';
}

function resetToEntry() {
  currentWorkflow.value = null;
  nodes.value = [];
  edges.value = [];
  selectedNodeId.value = null;
  state.value = 'entry';
  // Refresh workflows list
  fetch('/api/workflows').then(r => r.json()).then(wfs => workflows.value = wfs);
}

function selectNode(nodeId: string | null) {
  selectedNodeId.value = nodeId;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

async function onNodesChange(changes: Array<{ id: string; type: string; position?: { x: number; y: number }; dragging?: boolean }>) {
  for (const change of changes) {
    if (change.type === 'position' && change.position && !change.dragging) {
      const node = nodes.value.find(n => n.id === change.id);
      if (node) {
        node.position_x = change.position.x;
        node.position_y = change.position.y;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          fetch(`/api/nodes/${change.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position_x: change.position!.x, position_y: change.position!.y }),
          });
        }, 300);
      }
    }
  }
}

async function onEdgesChange(changes: Array<{ id: string; type: string }>) {
  for (const change of changes) {
    if (change.type === 'remove') {
      await fetch('/api/edges', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: change.id }),
      });
      edges.value = edges.value.filter(e => e.id !== change.id);
    }
  }
}

async function onConnect(params: { source: string; target: string; sourceHandle: string; targetHandle: string }) {
  if (!currentWorkflow.value) return;
  const res = await fetch('/api/edges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflow_id: currentWorkflow.value.id,
      source_node: params.source,
      target_node: params.target,
      source_handle: params.sourceHandle ?? 'output',
      target_handle: params.targetHandle ?? 'input',
    }),
  });
  const edge = await res.json();
  edges.value.push(edge);
}

async function onDropNode(type: string, position: { x: number; y: number }) {
  if (!currentWorkflow.value) return;
  const typeDef = nodeTypeRegistry[type];
  if (!typeDef) return;
  const res = await fetch(`/api/nodes/${currentWorkflow.value.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      node_type: type,
      title: typeDef.label,
      position_x: position.x,
      position_y: position.y,
    }),
  });
  const node = await res.json();
  nodes.value.push(node);
}

async function onUpdateNode(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/nodes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const updated = await res.json();
  const idx = nodes.value.findIndex(n => n.id === id);
  if (idx >= 0) nodes.value[idx] = updated;
}

async function onRunNode(nodeId: string) {
  const node = nodes.value.find(n => n.id === nodeId);
  if (node) node.status = 'running';
  try {
    const res = await fetch(`/api/nodes/${nodeId}/run`, { method: 'POST' });
    const updated = await res.json();
    const idx = nodes.value.findIndex(n => n.id === nodeId);
    if (idx >= 0) nodes.value[idx] = updated;
  } catch (err) {
    if (node) {
      node.status = 'error';
      node.error_message = String(err);
    }
  }
}

function goToSettings() {
  window.location.href = '/config';
}
</script>

<style scoped>
.editor-layout {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.editor-body {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.canvas-container {
  flex: 1;
  min-width: 0;
  position: relative;
}

/* Progress bar */
.progress-bar-container {
  height: 3px;
  background: var(--rh-border);
  flex-shrink: 0;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--rh-accent), color-mix(in srgb, var(--rh-accent) 80%, #fff));
  transition: width 0.6s ease;
  box-shadow: 0 0 12px var(--rh-accent), 0 0 4px var(--rh-accent);
  position: relative;
}

.progress-bar::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  width: 60px;
  height: 100%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--rh-accent) 60%, #fff));
  filter: blur(4px);
}

/* Floating toast */
.explore-toast {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  background: color-mix(in srgb, var(--rh-surface) 88%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid color-mix(in srgb, var(--rh-accent) 20%, var(--rh-border));
  border-radius: 12px;
  padding: 10px 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.1);
  z-index: 100;
  white-space: nowrap;
}

.toast-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid color-mix(in srgb, var(--rh-accent) 25%, transparent);
  border-top-color: var(--rh-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.toast-text {
  font-size: 13px;
  color: var(--rh-text);
}

.toast-layer {
  font-size: 11px;
  color: var(--rh-text-dim);
  padding: 2px 8px;
  background: var(--rh-surface-2);
  border-radius: 4px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Toast transition */
.toast-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(16px) scale(0.96);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px) scale(0.98);
}
</style>
