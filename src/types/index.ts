export interface Settings {
  openrouter_api_key: string;
  tavily_api_key: string;
  default_preset_id: string;
}

export interface Preset {
  id: string;
  name: string;
  model_id: string;
  temperature: number;
  max_tokens: number;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  viewport_x: number;
  viewport_y: number;
  viewport_zoom: number;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  workflow_id: string;
  name: string;
  parent_branch_id: string | null;
  fork_node_id: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowFull extends Workflow {
  nodes: NodeRecord[];
  edges: EdgeRecord[];
  branches: Branch[];
}

export interface NodeRecord {
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
  status: 'idle' | 'running' | 'done' | 'error';
  error_message: string;
  run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EdgeRecord {
  id: string;
  workflow_id: string;
  source_node: string;
  target_node: string;
  source_handle: string;
  target_handle: string;
  created_at: string;
}

export type NodeCategory = 'entry' | 'research' | 'analysis' | 'synthesis';

export interface HandleDef {
  name: string;
  type: string;
  label: string;
  required?: boolean;
}

export interface NodeTypeDef {
  type: string;
  label: string;
  icon: string;
  color: string;
  category: NodeCategory;
  inputs: HandleDef[];
  outputs: HandleDef[];
  defaultPrompt: string;
  useTavily: false | 'search' | 'extract';
  userInputField: boolean;
  outputFormat: 'text' | 'list' | 'table' | 'structured';
}
