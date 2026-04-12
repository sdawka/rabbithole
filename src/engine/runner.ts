import type { D1Database } from '@cloudflare/workers-types';
import { getNode, updateNode, getUpstreamOutputs } from '../db/nodes.js';
import { nodeTypes } from '../nodes/registry.js';
import { callLLM } from './openrouter.js';
import { tavilySearch, tavilyExtract } from './tavily.js';
import type { NodeRecord } from '../types/index.js';

function resolveTemplate(template: string, context: Record<string, string>): string {
  let result = template;

  // Handle conditional sections {{#key}}...{{/key}}
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_match, key, content) => {
    return context[key] ? content.replace(/\{\{(\w+)\}\}/g, (_m: string, k: string) => context[k] ?? '') : '';
  });

  // Replace remaining placeholders
  result = result.replace(/\{\{(\w+)\}\}/g, (_match, key) => context[key] ?? '');

  return result;
}

function buildContext(node: NodeRecord, upstreamOutputs: { handle: string; output: string }[]): Record<string, string> {
  const context: Record<string, string> = {};

  const byHandle = new Map<string, string[]>();
  for (const up of upstreamOutputs) {
    if (!up.output) continue;
    const existing = byHandle.get(up.handle) ?? [];
    existing.push(up.output);
    byHandle.set(up.handle, existing);
  }

  for (const [handle, outputs] of byHandle) {
    context[handle] = outputs.join('\n\n---\n\n');
  }

  if (node.user_input) {
    context['user_input'] = node.user_input;
  }

  return context;
}

async function runSourceDiscovery(db: D1Database, node: NodeRecord, context: Record<string, string>, systemPrompt: string): Promise<string> {
  const rendered = resolveTemplate(systemPrompt, context);
  const queriesText = await callLLM(
    db,
    rendered,
    'You generate web search queries. Return one query per line, nothing else. No numbering, no bullets.',
    node.preset_id
  );
  const queries = queriesText
    .split('\n')
    .map(q => q.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*]\s*/, '').trim())
    .filter(q => q.length > 3)
    .slice(0, 5);

  if (queries.length === 0) {
    return 'No search queries generated. Check upstream inputs.';
  }

  const allResults = [];
  for (const query of queries) {
    try {
      const results = await tavilySearch(db, query, 3);
      allResults.push(...results);
    } catch {
      // Continue with other queries
    }
  }

  if (allResults.length === 0) {
    return 'Tavily search returned no results. Check your Tavily API key in Settings.';
  }

  const seen = new Set<string>();
  const unique = allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  return unique.map(r => `**${r.title}**\nURL: ${r.url}\n${r.content}`).join('\n\n---\n\n');
}

async function runSourceAnalysis(db: D1Database, node: NodeRecord, context: Record<string, string>, systemPrompt: string): Promise<string> {
  const sourcesText = context['sources'] ?? '';

  const urlMatches = sourcesText.match(/URL:\s*(https?:\/\/[^\s\n]+)/g) ?? [];
  const urls = urlMatches.map(m => m.replace(/^URL:\s*/, '').trim()).slice(0, 5);

  let sourceContent = '';
  if (urls.length > 0) {
    try {
      const extracted = await tavilyExtract(db, urls);
      sourceContent = extracted
        .map(e => `--- ${e.url} ---\n${e.raw_content?.slice(0, 3000) ?? 'No content extracted'}`)
        .join('\n\n');
    } catch {
      sourceContent = sourcesText;
    }
  } else {
    sourceContent = sourcesText;
  }

  context['source_content'] = sourceContent;
  const prompt = resolveTemplate(systemPrompt, context);
  return callLLM(db, prompt, 'You are a thorough research analyst. Be concise.', node.preset_id);
}

export async function runNode(db: D1Database, nodeId: string): Promise<NodeRecord> {
  const node = await getNode(db, nodeId);
  if (!node) throw new Error(`Node ${nodeId} not found`);

  const typeDef = nodeTypes[node.node_type];
  if (!typeDef) throw new Error(`Unknown node type: ${node.node_type}`);

  await updateNode(db, nodeId, { status: 'running', error_message: '' });

  try {
    const upstreamOutputs = await getUpstreamOutputs(db, nodeId);
    const context = buildContext(node, upstreamOutputs);
    const systemPrompt = node.system_prompt || typeDef.defaultPrompt;
    let output: string;

    if (typeDef.useTavily === 'search') {
      output = await runSourceDiscovery(db, node, context, systemPrompt);

    } else if (typeDef.useTavily === 'extract') {
      output = await runSourceAnalysis(db, node, context, systemPrompt);

    } else {
      const prompt = resolveTemplate(systemPrompt, context);
      output = await callLLM(db, prompt, 'You are a curious and thorough research assistant. Be concise.', node.preset_id);
    }

    const now = new Date().toISOString();
    await updateNode(db, nodeId, { output_data: output, status: 'done', run_at: now });
    return (await getNode(db, nodeId))!;

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateNode(db, nodeId, { status: 'error', error_message: message });
    return (await getNode(db, nodeId))!;
  }
}
