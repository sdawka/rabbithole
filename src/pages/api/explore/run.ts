import type { APIRoute } from 'astro';
import { createWorkflow } from '../../../db/workflows.js';
import { createNode, updateNode, getNode } from '../../../db/nodes.js';
import { createEdge } from '../../../db/edges.js';
import { nodeTypes } from '../../../nodes/registry.js';
import { runNode } from '../../../engine/runner.js';
import { planAnalysisLayer } from '../../../engine/planner.js';
import { extractKeys } from '../../../engine/openrouter.js';

interface CreatedNode {
  id: string;
  type: string;
}

const COL_SPACING = 400;
const ROW_SPACING = 200;

function pos(col: number, row: number) {
  return { x: col * COL_SPACING, y: row * ROW_SPACING };
}

export const POST: APIRoute = async ({ request }) => {
  const keys = extractKeys(request);
  const { topic, context, angles } = await request.json() as {
    topic: string;
    context: string;
    angles: string[];
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const workflow = await createWorkflow({ name: topic.slice(0, 60) });
        send({ type: 'workflow_created', workflowId: workflow.id });

        const created = new Map<string, CreatedNode>();
        const anglesContext = angles.length > 0 ? `\nUser's exploration angles: ${angles.join(', ')}` : '';

        async function makeNode(
          type: string, title: string, col: number, row: number,
          opts?: { userInput?: string; customPrompt?: string }
        ): Promise<string> {
          const typeDef = nodeTypes[type];
          const { x, y } = pos(col, row);
          const node = await createNode({
            workflow_id: workflow.id,
            node_type: type,
            title,
            position_x: x,
            position_y: y,
            system_prompt: opts?.customPrompt || typeDef?.defaultPrompt || '',
            user_input: opts?.userInput || '',
          });
          created.set(type, { id: node.id, type });
          send({
            type: 'node_created',
            nodeId: node.id,
            nodeType: type,
            title,
            position: { x, y },
            data: node,
          });
          return node.id;
        }

        async function makeEdge(sourceType: string, targetId: string, sourceHandle: string, targetHandle: string) {
          const source = created.get(sourceType);
          if (!source) return;
          const edge = await createEdge({
            workflow_id: workflow.id,
            source_node: source.id,
            target_node: targetId,
            source_handle: sourceHandle,
            target_handle: targetHandle,
          });
          send({
            type: 'edge_created',
            edgeId: edge.id,
            source: source.id,
            target: targetId,
            sourceHandle: sourceHandle,
            targetHandle: targetHandle,
          });
        }

        async function execNode(nodeId: string) {
          send({ type: 'node_start', nodeId });
          const result = await runNode(keys, nodeId);
          send({
            type: 'node_complete',
            nodeId,
            status: result.status,
            output: result.output_data || '',
            error: result.error_message || undefined,
          });
          return result;
        }

        // ---- LAYER 1: Topic Entry + Brain Dump ----
        send({ type: 'layer_start', layer: 1, description: 'Setting up your rabbit hole...' });

        const topicId = await makeNode('topic_entry', 'Topic Entry', 0, 2, {
          userInput: topic + (context ? `\n\n${context}` : '') + anglesContext,
        });
        await execNode(topicId);

        const brainDumpId = await makeNode('brain_dump', 'Brain Dump', 1, 2, {
          userInput: context || '',
        });
        await makeEdge('topic_entry', brainDumpId, 'topic', 'topic');
        await execNode(brainDumpId);

        send({ type: 'layer_complete', layer: 1 });

        // ---- LAYER 2: Research Questions ----
        send({ type: 'layer_start', layer: 2, description: 'Generating research questions...' });

        const questionsId = await makeNode('research_questions', 'Research Questions', 2, 2);
        await makeEdge('topic_entry', questionsId, 'topic', 'topic');
        await makeEdge('brain_dump', questionsId, 'knowledge_dump', 'knowledge_dump');
        await execNode(questionsId);

        send({ type: 'layer_complete', layer: 2 });

        // ---- LAYER 3: Source Discovery (Tavily search) ----
        send({ type: 'layer_start', layer: 3, description: 'Searching for sources...' });

        const discoveryId = await makeNode('source_discovery', 'Source Discovery', 3, 2);
        await makeEdge('topic_entry', discoveryId, 'topic', 'topic');
        await makeEdge('research_questions', discoveryId, 'questions', 'questions');
        await execNode(discoveryId);

        send({ type: 'layer_complete', layer: 3 });

        // ---- LAYER 4: Source Analysis (Tavily extract + LLM) ----
        send({ type: 'layer_start', layer: 4, description: 'Analyzing sources...' });

        const analysisId = await makeNode('source_analysis', 'Source Analysis', 4, 2);
        await makeEdge('topic_entry', analysisId, 'topic', 'topic');
        await makeEdge('source_discovery', analysisId, 'sources', 'sources');
        const analysisResult = await execNode(analysisId);

        send({ type: 'layer_complete', layer: 4 });

        // ---- LAYER 5: Agent decides which analysis nodes to create ----
        send({ type: 'planning', layer: 5, description: 'Analyzing results to decide next steps...' });

        const plan = await planAnalysisLayer(
          keys,
          topic,
          angles,
          analysisResult.output_data || '',
          null
        );

        send({ type: 'layer_start', layer: 5, description: `Running analysis: ${plan.nodes.join(', ')}` });

        const analysisNodeIds: string[] = [];
        const totalAnalysis = plan.nodes.length;
        const startRow = 2 - (totalAnalysis - 1) / 2;

        for (let i = 0; i < plan.nodes.length; i++) {
          const nodeType = plan.nodes[i];
          const typeDef = nodeTypes[nodeType];
          const row = startRow + i * 1.2;
          const nodeId = await makeNode(nodeType, typeDef?.label || nodeType, 5, row);

          if (nodeType === 'emerging_questions') {
            await makeEdge('source_analysis', nodeId, 'new_questions', 'new_questions');
          } else {
            await makeEdge('source_analysis', nodeId, 'insights', 'insights');
          }

          analysisNodeIds.push(nodeId);
        }

        await Promise.allSettled(analysisNodeIds.map(id => execNode(id)));

        send({ type: 'layer_complete', layer: 5 });

        // ---- LAYER 6: Pattern Recognition ----
        send({ type: 'layer_start', layer: 6, description: 'Finding patterns...' });

        const patternId = await makeNode('pattern_recognition', 'Pattern Recognition', 6, 2);
        await makeEdge('source_analysis', patternId, 'insights', 'insights');
        if (created.has('key_concepts')) {
          await makeEdge('key_concepts', patternId, 'concepts', 'concepts');
        }
        await execNode(patternId);

        send({ type: 'layer_complete', layer: 6 });

        // ---- LAYER 7: Synthesis + Reflection ----
        send({ type: 'layer_start', layer: 7, description: 'Synthesizing findings...' });

        const synthesisId = await makeNode('synthesis', 'Synthesis', 7, 2);
        await makeEdge('topic_entry', synthesisId, 'topic', 'topic');
        await makeEdge('pattern_recognition', synthesisId, 'patterns', 'patterns');
        if (created.has('aha_moments')) {
          await makeEdge('aha_moments', synthesisId, 'aha_findings', 'aha_findings');
        }
        if (created.has('key_concepts')) {
          await makeEdge('key_concepts', synthesisId, 'concepts', 'concepts');
        }
        if (created.has('key_people')) {
          await makeEdge('key_people', synthesisId, 'people', 'people');
        }
        await execNode(synthesisId);

        const reflectionId = await makeNode('reflection', 'Reflection', 8, 2);
        await makeEdge('topic_entry', reflectionId, 'topic', 'topic');
        await makeEdge('synthesis', reflectionId, 'summary', 'summary');
        await execNode(reflectionId);

        send({ type: 'layer_complete', layer: 7 });
        send({ type: 'explore_complete', workflowId: workflow.id });

      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        send({ type: 'explore_error', error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
};
