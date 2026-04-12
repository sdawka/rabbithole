import type { NodeRecord, EdgeRecord } from '../types/index.js';

export function topologicalSort(nodes: NodeRecord[], edges: EdgeRecord[]): string[][] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    inDegree.set(edge.target_node, (inDegree.get(edge.target_node) ?? 0) + 1);
    adjacency.get(edge.source_node)?.push(edge.target_node);
  }

  const layers: string[][] = [];
  let queue = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0).map(n => n.id);

  while (queue.length > 0) {
    layers.push([...queue]);
    const nextQueue: string[] = [];
    for (const nodeId of queue) {
      for (const neighbor of adjacency.get(nodeId) ?? []) {
        const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          nextQueue.push(neighbor);
        }
      }
    }
    queue = nextQueue;
  }

  const sortedCount = layers.reduce((sum, layer) => sum + layer.length, 0);
  if (sortedCount !== nodes.length) {
    throw new Error('Cycle detected in graph');
  }

  return layers;
}
