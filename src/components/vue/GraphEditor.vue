<template>
  <div class="editor-layout" :class="{ 'canvas-mode': state === 'exploring' || state === 'browsing' }">
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
            @node-dblclick="openNodeDetail"
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
          @delete-node="onDeleteNode"
          @expand-node="openNodeDetail"
          @close="selectedNodeId = null"
        />
      </template>
    </div>

    <NodeDetailModal
      :node="detailNode"
      :allNodes="nodes"
      :edges="edges"
      :nodeTypes="nodeTypeRegistry"
      @close="detailNodeId = null"
      @navigate="navigateDetail"
    />

    <!-- Branch selector (floating) -->
    <div v-if="branches.length > 0 && (state === 'exploring' || state === 'browsing')" class="branch-selector">
      <select :value="currentBranchId ?? ''" @change="onBranchChange">
        <option value="">main</option>
        <option v-for="b in branches" :key="b.id" :value="b.id">
          {{ b.name }}
        </option>
      </select>
    </div>

    <!-- Branch dialog -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showBranchDialog" class="modal-overlay" @click.self="showBranchDialog = false">
          <div class="branch-dialog">
            <h3>Continue from this node</h3>
            <p class="branch-dialog-desc">Run this node and all downstream nodes. Choose how to handle existing outputs:</p>

            <div class="branch-dialog-options">
              <button class="branch-option" @click="onBranchDialogRun(false)">
                <span class="option-icon">↻</span>
                <span class="option-text">
                  <strong>Overwrite</strong>
                  <span>Re-run on current branch, replacing outputs</span>
                </span>
              </button>

              <div class="branch-option-new">
                <div class="option-header">
                  <span class="option-icon">⑂</span>
                  <span class="option-text">
                    <strong>New branch</strong>
                    <span>Fork from here, keep original intact</span>
                  </span>
                </div>
                <div class="branch-name-input">
                  <input
                    v-model="newBranchName"
                    placeholder="Branch name..."
                    @keydown.enter="newBranchName.trim() && onBranchDialogRun(true)"
                  />
                  <button
                    class="btn btn-primary"
                    :disabled="!newBranchName.trim()"
                    @click="onBranchDialogRun(true)"
                  >
                    Create & Run
                  </button>
                </div>
              </div>
            </div>

            <button class="branch-dialog-cancel" @click="showBranchDialog = false">Cancel</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import EntryForm from './EntryForm.vue';
import ClarifyStep from './ClarifyStep.vue';
import RightSidebar from './sidebar/RightSidebar.vue';
import TopToolbar from './toolbar/TopToolbar.vue';
import FlowCanvas from './canvas/FlowCanvas.vue';
import NodeDetailModal from './NodeDetailModal.vue';

interface NodeRecord {
  id: string;
  workflow_id: string;
  branch_id: string | null;
  source_node_id: string | null;
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

interface Branch {
  id: string;
  workflow_id: string;
  name: string;
  parent_branch_id: string | null;
  fork_node_id: string | null;
  color: string;
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
const branches = ref<Branch[]>([]);
const currentBranchId = ref<string | null>(null);
const selectedNodeId = ref<string | null>(null);
const presets = ref<Preset[]>([]);
const layerDescription = ref('');
const currentLayer = ref(0);
const totalLayers = ref(7);

// Branch dialog state
const showBranchDialog = ref(false);
const pendingRunNodeId = ref<string | null>(null);
const newBranchName = ref('');

// Clarify state
const currentTopic = ref('');
const currentContext = ref('');
const clarifySummary = ref('');
const clarifyAngles = ref<Array<{ id: string; label: string; description: string }>>([]);

// Computed
const selectedNode = computed(() => nodes.value.find(n => n.id === selectedNodeId.value) ?? null);
const selectedNodeTypeDef = computed(() => selectedNode.value ? nodeTypeRegistry[selectedNode.value.node_type] : null);

// Filter nodes to show: main branch nodes (no branch_id) + current branch nodes
const visibleNodes = computed(() => {
  if (!currentBranchId.value) {
    // Show only main branch (nodes with no branch_id)
    return nodes.value.filter(n => !n.branch_id);
  }
  // Show main branch nodes that aren't overridden + current branch nodes
  const branchNodeSources = new Set(
    nodes.value.filter(n => n.branch_id === currentBranchId.value).map(n => n.source_node_id)
  );
  return nodes.value.filter(n =>
    n.branch_id === currentBranchId.value ||
    (!n.branch_id && !branchNodeSources.has(n.id))
  );
});

const flowNodes = computed(() =>
  visibleNodes.value.map(n => {
    const typeDef = nodeTypeRegistry[n.node_type];
    const branch = n.branch_id ? branches.value.find(b => b.id === n.branch_id) : null;
    return {
      id: n.id,
      type: 'rabbithole',
      position: { x: n.position_x, y: n.position_y },
      data: { ...n, typeDef, branchColor: branch?.color },
    };
  })
);

const flowEdges = computed(() => {
  const visibleNodeIds = new Set(visibleNodes.value.map(n => n.id));
  return edges.value
    .filter(e => visibleNodeIds.has(e.source_node) && visibleNodeIds.has(e.target_node))
    .map(e => ({
      id: e.id,
      source: e.source_node,
      target: e.target_node,
      sourceHandle: e.source_handle,
      targetHandle: e.target_handle,
      animated: nodes.value.find(n => n.id === e.source_node)?.status === 'running',
    }));
});

onMounted(async () => {
  const [wfRes, presetRes] = await Promise.all([
    fetch('/api/workflows'),
    fetch('/api/config/presets'),
  ]);
  workflows.value = await wfRes.json();
  presets.value = await presetRes.json();
});

function keyHeaders(): Record<string, string> {
  return {
    'X-OpenRouter-Key': localStorage.getItem('rh_openrouter_key') ?? '',
    'X-Tavily-Key': localStorage.getItem('rh_tavily_key') ?? '',
  };
}

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
      headers: { 'Content-Type': 'application/json', ...keyHeaders() },
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
      headers: { 'Content-Type': 'application/json', ...keyHeaders() },
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
        branch_id: null,
        source_node_id: null,
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
  branches.value = wf.branches ?? [];
  // Default to main branch or first branch
  const mainBranch = branches.value.find(b => b.name === 'main');
  currentBranchId.value = mainBranch?.id ?? null;
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

// Node detail modal
const detailNodeId = ref<string | null>(null);
const detailNode = computed(() => nodes.value.find(n => n.id === detailNodeId.value) ?? null);

function openNodeDetail(nodeId: string) {
  detailNodeId.value = nodeId;
}

function navigateDetail(nodeId: string) {
  detailNodeId.value = nodeId;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && detailNodeId.value) {
    detailNodeId.value = null;
  }
  // Delete selected node with Backspace or Delete key
  if ((e.key === 'Backspace' || e.key === 'Delete') && selectedNodeId.value) {
    // Don't delete if user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    onDeleteNode(selectedNodeId.value);
  }
}

function onRunFrom(e: Event) {
  const detail = (e as CustomEvent).detail;
  if (detail?.nodeId) {
    // Show branch dialog to let user choose
    pendingRunNodeId.value = detail.nodeId;
    newBranchName.value = '';
    showBranchDialog.value = true;
  }
}

function onBranchDialogRun(createBranch: boolean) {
  const nodeId = pendingRunNodeId.value;
  showBranchDialog.value = false;
  if (!nodeId) return;

  if (createBranch && newBranchName.value.trim()) {
    runFromNode(nodeId, newBranchName.value.trim());
  } else {
    runFromNode(nodeId);
  }
  pendingRunNodeId.value = null;
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  document.addEventListener('rh-run-from', onRunFrom);
});
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  document.removeEventListener('rh-run-from', onRunFrom);
});

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

async function onDeleteNode(id: string) {
  await fetch(`/api/nodes/${id}`, { method: 'DELETE' });
  nodes.value = nodes.value.filter(n => n.id !== id);
  edges.value = edges.value.filter(e => e.source_node !== id && e.target_node !== id);
  selectedNodeId.value = null;
}

async function onRunNode(nodeId: string) {
  const node = nodes.value.find(n => n.id === nodeId);
  if (node) node.status = 'running';
  try {
    const res = await fetch(`/api/nodes/${nodeId}/run`, { method: 'POST', headers: keyHeaders() });
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

async function runFromNode(startNodeId: string, branchName?: string) {
  try {
    const res = await fetch(`/api/nodes/${startNodeId}/run-from`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...keyHeaders() },
      body: JSON.stringify(branchName ? { branchName } : {}),
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
          handleRunFromEvent(data);
        } catch { /* skip malformed events */ }
      }
    }
  } catch (err) {
    console.error('Run from error:', err);
  } finally {
    // Reload workflow to get final state
    if (currentWorkflow.value) {
      await loadWorkflow(currentWorkflow.value.id);
    }
  }
}

function handleRunFromEvent(data: Record<string, any>) {
  switch (data.type) {
    case 'run_start': {
      // If a new branch was created, switch to it
      if (data.branch) {
        branches.value.push({
          id: data.branch.id,
          workflow_id: currentWorkflow.value?.id ?? '',
          name: data.branch.name,
          parent_branch_id: currentBranchId.value,
          fork_node_id: null,
          color: '#6366f1',
        });
        currentBranchId.value = data.branch.id;
      }
      // Reset all nodes that will be run
      for (const nodeId of data.nodeIds ?? []) {
        const node = nodes.value.find(n => n.id === nodeId);
        if (node) {
          node.status = 'idle';
          node.output_data = '';
          node.error_message = '';
        }
      }
      break;
    }
    case 'node_start': {
      const node = nodes.value.find(n => n.id === data.nodeId);
      if (node) node.status = 'running';
      break;
    }
    case 'node_complete': {
      const node = nodes.value.find(n => n.id === data.nodeId);
      if (node) {
        node.status = data.status;
        if (data.output) node.output_data = data.output;
        if (data.error) node.error_message = data.error;
      }
      break;
    }
  }
}

function goToSettings() {
  window.location.href = '/config';
}

function onBranchChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value;
  currentBranchId.value = value || null;
}
</script>

<style scoped>
.editor-layout {
  display: flex;
  flex-direction: column;
  width: 100vw;
  min-height: 100vh;
}

.editor-layout.canvas-mode {
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

/* Branch selector */
.branch-selector {
  position: fixed;
  top: 60px;
  right: 16px;
  z-index: 50;
}

.branch-selector select {
  padding: 6px 28px 6px 12px;
  background: var(--rh-surface);
  border: 1px solid var(--rh-border);
  border-radius: 8px;
  color: var(--rh-text);
  font-size: 12px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}

.branch-selector select:hover {
  border-color: var(--rh-accent);
}

/* Branch dialog */
.branch-dialog {
  background: var(--rh-surface);
  border: 1px solid var(--rh-border);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

.branch-dialog h3 {
  font-family: var(--rh-font-display);
  font-size: 20px;
  font-weight: 400;
  font-style: italic;
  margin: 0 0 8px;
}

.branch-dialog-desc {
  font-size: 13px;
  color: var(--rh-text-dim);
  margin: 0 0 20px;
  line-height: 1.5;
}

.branch-dialog-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.branch-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--rh-bg);
  border: 1px solid var(--rh-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  width: 100%;
}

.branch-option:hover {
  border-color: var(--rh-accent);
  background: color-mix(in srgb, var(--rh-accent) 5%, var(--rh-bg));
}

.branch-option-new {
  padding: 14px 16px;
  background: var(--rh-bg);
  border: 1px solid var(--rh-border);
  border-radius: 10px;
}

.branch-option-new .option-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.option-icon {
  font-size: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rh-surface-2);
  border-radius: 8px;
  flex-shrink: 0;
}

.option-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-text strong {
  font-size: 14px;
  font-weight: 600;
}

.option-text span {
  font-size: 12px;
  color: var(--rh-text-dim);
}

.branch-name-input {
  display: flex;
  gap: 8px;
}

.branch-name-input input {
  flex: 1;
  padding: 8px 12px;
  background: var(--rh-surface);
  border: 1px solid var(--rh-border);
  border-radius: 6px;
  color: var(--rh-text);
  font-size: 13px;
}

.branch-name-input input:focus {
  outline: none;
  border-color: var(--rh-accent);
}

.branch-dialog-cancel {
  width: 100%;
  margin-top: 16px;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--rh-border);
  border-radius: 8px;
  color: var(--rh-text-dim);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.branch-dialog-cancel:hover {
  border-color: var(--rh-text-dim);
  color: var(--rh-text);
}

/* Modal transitions (reuse from NodeDetailModal) */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 32px;
}

.modal-enter-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-leave-active {
  transition: all 0.15s ease;
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .branch-dialog {
  transform: scale(0.96) translateY(8px);
}
.modal-leave-to {
  opacity: 0;
}
</style>
