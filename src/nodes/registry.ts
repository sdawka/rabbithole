import type { NodeTypeDef } from '../types/index.js';
import { defaultTemplates } from './templates.js';

export const nodeTypes: Record<string, NodeTypeDef> = {
  topic_entry: {
    type: 'topic_entry',
    label: 'Topic Entry',
    icon: '🕳️',
    color: '#e94560',
    category: 'entry',
    inputs: [],
    outputs: [
      { name: 'topic', type: 'string', label: 'Topic' },
    ],
    defaultPrompt: defaultTemplates.topic_entry,
    useTavily: false,
    userInputField: true,
    outputFormat: 'text',
  },
  brain_dump: {
    type: 'brain_dump',
    label: 'Brain Dump',
    icon: '🧠',
    color: '#e94560',
    category: 'entry',
    inputs: [
      { name: 'topic', type: 'string', label: 'Topic', required: true },
    ],
    outputs: [
      { name: 'knowledge_dump', type: 'string', label: 'Knowledge Dump' },
    ],
    defaultPrompt: defaultTemplates.brain_dump,
    useTavily: false,
    userInputField: true,
    outputFormat: 'text',
  },
  research_questions: {
    type: 'research_questions',
    label: 'Research Questions',
    icon: '🎯',
    color: '#0f3460',
    category: 'research',
    inputs: [
      { name: 'topic', type: 'string', label: 'Topic', required: true },
      { name: 'knowledge_dump', type: 'string', label: 'Knowledge Dump' },
    ],
    outputs: [
      { name: 'questions', type: 'string', label: 'Questions' },
    ],
    defaultPrompt: defaultTemplates.research_questions,
    useTavily: false,
    userInputField: false,
    outputFormat: 'list',
  },
  source_discovery: {
    type: 'source_discovery',
    label: 'Source Discovery',
    icon: '🔍',
    color: '#0f3460',
    category: 'research',
    inputs: [
      { name: 'topic', type: 'string', label: 'Topic', required: true },
      { name: 'questions', type: 'string', label: 'Questions' },
    ],
    outputs: [
      { name: 'sources', type: 'string', label: 'Sources' },
    ],
    defaultPrompt: defaultTemplates.source_discovery,
    useTavily: 'search',
    userInputField: false,
    outputFormat: 'table',
  },
  source_analysis: {
    type: 'source_analysis',
    label: 'Source Analysis',
    icon: '📖',
    color: '#533483',
    category: 'analysis',
    inputs: [
      { name: 'topic', type: 'string', label: 'Topic' },
      { name: 'sources', type: 'string', label: 'Sources', required: true },
    ],
    outputs: [
      { name: 'insights', type: 'string', label: 'Insights' },
      { name: 'new_questions', type: 'string', label: 'New Questions' },
    ],
    defaultPrompt: defaultTemplates.source_analysis,
    useTavily: 'extract',
    userInputField: false,
    outputFormat: 'structured',
  },
  emerging_questions: {
    type: 'emerging_questions',
    label: 'Emerging Questions',
    icon: '❓',
    color: '#533483',
    category: 'analysis',
    inputs: [
      { name: 'topic', type: 'string', label: 'Topic' },
      { name: 'new_questions', type: 'string', label: 'New Questions', required: true },
    ],
    outputs: [
      { name: 'prioritized_questions', type: 'string', label: 'Prioritized Questions' },
    ],
    defaultPrompt: defaultTemplates.emerging_questions,
    useTavily: false,
    userInputField: false,
    outputFormat: 'list',
  },
  aha_moments: {
    type: 'aha_moments',
    label: 'Aha Moments',
    icon: '⚡',
    color: '#533483',
    category: 'analysis',
    inputs: [
      { name: 'topic', type: 'string', label: 'Topic' },
      { name: 'insights', type: 'string', label: 'Insights', required: true },
    ],
    outputs: [
      { name: 'aha_findings', type: 'string', label: 'Aha Findings' },
    ],
    defaultPrompt: defaultTemplates.aha_moments,
    useTavily: false,
    userInputField: false,
    outputFormat: 'structured',
  },
  key_concepts: {
    type: 'key_concepts',
    label: 'Key Concepts',
    icon: '📚',
    color: '#533483',
    category: 'analysis',
    inputs: [
      { name: 'topic', type: 'string', label: 'Topic' },
      { name: 'insights', type: 'string', label: 'Insights', required: true },
    ],
    outputs: [
      { name: 'concepts', type: 'string', label: 'Concepts' },
    ],
    defaultPrompt: defaultTemplates.key_concepts,
    useTavily: false,
    userInputField: false,
    outputFormat: 'list',
  },
  key_people: {
    type: 'key_people',
    label: 'Key People',
    icon: '🧑‍🔬',
    color: '#533483',
    category: 'analysis',
    inputs: [
      { name: 'topic', type: 'string', label: 'Topic' },
      { name: 'insights', type: 'string', label: 'Insights', required: true },
    ],
    outputs: [
      { name: 'people', type: 'string', label: 'People' },
    ],
    defaultPrompt: defaultTemplates.key_people,
    useTavily: false,
    userInputField: false,
    outputFormat: 'list',
  },
  pattern_recognition: {
    type: 'pattern_recognition',
    label: 'Pattern Recognition',
    icon: '🧵',
    color: '#e94560',
    category: 'synthesis',
    inputs: [
      { name: 'topic', type: 'string', label: 'Topic' },
      { name: 'insights', type: 'string', label: 'Insights' },
      { name: 'concepts', type: 'string', label: 'Concepts' },
    ],
    outputs: [
      { name: 'patterns', type: 'string', label: 'Patterns' },
    ],
    defaultPrompt: defaultTemplates.pattern_recognition,
    useTavily: false,
    userInputField: false,
    outputFormat: 'structured',
  },
  synthesis: {
    type: 'synthesis',
    label: 'Synthesis',
    icon: '🔆',
    color: '#e94560',
    category: 'synthesis',
    inputs: [
      { name: 'topic', type: 'string', label: 'Topic' },
      { name: 'patterns', type: 'string', label: 'Patterns' },
      { name: 'aha_findings', type: 'string', label: 'Aha Findings' },
      { name: 'concepts', type: 'string', label: 'Concepts' },
      { name: 'people', type: 'string', label: 'People' },
    ],
    outputs: [
      { name: 'summary', type: 'string', label: 'Summary' },
    ],
    defaultPrompt: defaultTemplates.synthesis,
    useTavily: false,
    userInputField: false,
    outputFormat: 'text',
  },
  reflection: {
    type: 'reflection',
    label: 'Reflection',
    icon: '🌫️',
    color: '#e94560',
    category: 'synthesis',
    inputs: [
      { name: 'topic', type: 'string', label: 'Topic' },
      { name: 'summary', type: 'string', label: 'Summary', required: true },
    ],
    outputs: [
      { name: 'reflection', type: 'string', label: 'Reflection' },
    ],
    defaultPrompt: defaultTemplates.reflection,
    useTavily: false,
    userInputField: true,
    outputFormat: 'text',
  },
};

export const nodeTypeList = Object.values(nodeTypes);

export const nodeTypesByCategory = {
  entry: nodeTypeList.filter(n => n.category === 'entry'),
  research: nodeTypeList.filter(n => n.category === 'research'),
  analysis: nodeTypeList.filter(n => n.category === 'analysis'),
  synthesis: nodeTypeList.filter(n => n.category === 'synthesis'),
};

export function getDefaultTemplate(): { nodes: Array<{ type: string; title: string; x: number; y: number }>; edges: Array<{ source: string; target: string; sourceHandle: string; targetHandle: string }> } {
  // Left-to-right flow
  const col = (n: number) => n * 400; // column spacing
  const row = (n: number) => n * 200; // row spacing
  const nodes = [
    { type: 'topic_entry', title: 'Topic Entry', x: col(0), y: row(2) },
    { type: 'brain_dump', title: 'Brain Dump', x: col(1), y: row(2) },
    { type: 'research_questions', title: 'Research Questions', x: col(2), y: row(2) },
    { type: 'source_discovery', title: 'Source Discovery', x: col(3), y: row(2) },
    { type: 'source_analysis', title: 'Source Analysis', x: col(4), y: row(2) },
    { type: 'emerging_questions', title: 'Emerging Questions', x: col(5), y: row(0) },
    { type: 'aha_moments', title: 'Aha Moments', x: col(5), y: row(1.5) },
    { type: 'key_concepts', title: 'Key Concepts', x: col(5), y: row(2.5) },
    { type: 'key_people', title: 'Key People', x: col(5), y: row(4) },
    { type: 'pattern_recognition', title: 'Pattern Recognition', x: col(6), y: row(2) },
    { type: 'synthesis', title: 'Synthesis', x: col(7), y: row(2) },
    { type: 'reflection', title: 'Reflection', x: col(8), y: row(2) },
  ];

  // Clean linear connections — each step feeds the next
  const edges = [
    // Main spine: topic flows down
    { source: 'topic_entry', target: 'brain_dump', sourceHandle: 'topic', targetHandle: 'topic' },
    { source: 'brain_dump', target: 'research_questions', sourceHandle: 'knowledge_dump', targetHandle: 'knowledge_dump' },
    { source: 'topic_entry', target: 'research_questions', sourceHandle: 'topic', targetHandle: 'topic' },
    { source: 'research_questions', target: 'source_discovery', sourceHandle: 'questions', targetHandle: 'questions' },
    { source: 'topic_entry', target: 'source_discovery', sourceHandle: 'topic', targetHandle: 'topic' },
    { source: 'source_discovery', target: 'source_analysis', sourceHandle: 'sources', targetHandle: 'sources' },
    { source: 'topic_entry', target: 'source_analysis', sourceHandle: 'topic', targetHandle: 'topic' },

    // Fan out: source_analysis → 4 analysis nodes
    { source: 'source_analysis', target: 'emerging_questions', sourceHandle: 'new_questions', targetHandle: 'new_questions' },
    { source: 'source_analysis', target: 'aha_moments', sourceHandle: 'insights', targetHandle: 'insights' },
    { source: 'source_analysis', target: 'key_concepts', sourceHandle: 'insights', targetHandle: 'insights' },
    { source: 'source_analysis', target: 'key_people', sourceHandle: 'insights', targetHandle: 'insights' },

    // Converge: analysis nodes → pattern recognition
    { source: 'source_analysis', target: 'pattern_recognition', sourceHandle: 'insights', targetHandle: 'insights' },
    { source: 'key_concepts', target: 'pattern_recognition', sourceHandle: 'concepts', targetHandle: 'concepts' },

    // Converge: into synthesis
    { source: 'pattern_recognition', target: 'synthesis', sourceHandle: 'patterns', targetHandle: 'patterns' },
    { source: 'aha_moments', target: 'synthesis', sourceHandle: 'aha_findings', targetHandle: 'aha_findings' },
    { source: 'key_concepts', target: 'synthesis', sourceHandle: 'concepts', targetHandle: 'concepts' },
    { source: 'key_people', target: 'synthesis', sourceHandle: 'people', targetHandle: 'people' },
    { source: 'topic_entry', target: 'synthesis', sourceHandle: 'topic', targetHandle: 'topic' },

    // Final
    { source: 'synthesis', target: 'reflection', sourceHandle: 'summary', targetHandle: 'summary' },
    { source: 'topic_entry', target: 'reflection', sourceHandle: 'topic', targetHandle: 'topic' },
  ];

  return { nodes, edges };
}
