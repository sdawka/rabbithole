import type { D1Database } from '@cloudflare/workers-types';
import { callLLM } from './openrouter.js';

export interface PlannerResult {
  nodes: string[];
  reasoning: string;
}

const ANALYSIS_NODES = ['emerging_questions', 'aha_moments', 'key_concepts', 'key_people'];

const ANALYSIS_DESCRIPTIONS: Record<string, string> = {
  emerging_questions: 'Synthesize and prioritize follow-up questions that emerged from the research',
  aha_moments: 'Identify the most surprising, paradigm-shifting, or counter-intuitive findings',
  key_concepts: 'Extract and define the core concepts and terminology',
  key_people: 'Identify key researchers, practitioners, critics, and their work/channels to follow',
};

export async function planAnalysisLayer(
  db: D1Database,
  topic: string,
  angles: string[],
  sourceAnalysisOutput: string,
  presetId?: string | null
): Promise<PlannerResult> {
  const nodeDescriptions = ANALYSIS_NODES.map(
    t => `- "${t}": ${ANALYSIS_DESCRIPTIONS[t]}`
  ).join('\n');

  const prompt = `You are deciding which analysis steps to run for a rabbit hole exploration.

Topic: "${topic}"
User's interests: ${angles.join(', ')}

Source analysis results (summary of what was found):
${sourceAnalysisOutput.slice(0, 2000)}

Available analysis nodes:
${nodeDescriptions}

Based on the source analysis results and the user's interests, pick 2-4 of these analysis nodes that would be MOST valuable for this specific topic. Not every topic needs all of them.

Guidelines:
- Always include "aha_moments" — surprises are always valuable
- Include "key_people" if the sources mention specific researchers, creators, or experts worth following
- Include "key_concepts" if there's specialized terminology or frameworks
- Include "emerging_questions" if the sources opened up interesting tangents

Return ONLY valid JSON, no markdown fences:
{"nodes": ["aha_moments", "key_concepts"], "reasoning": "One sentence why"}`;

  const response = await callLLM(db, prompt, 'Return only valid JSON. No explanation outside the JSON.', presetId);

  try {
    const cleaned = response.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned) as PlannerResult;
    parsed.nodes = parsed.nodes.filter(n => ANALYSIS_NODES.includes(n));
    if (parsed.nodes.length === 0) {
      parsed.nodes = ['aha_moments'];
    }
    return parsed;
  } catch {
    return { nodes: ['aha_moments', 'key_concepts'], reasoning: 'Default selection (planner response was not valid JSON)' };
  }
}
