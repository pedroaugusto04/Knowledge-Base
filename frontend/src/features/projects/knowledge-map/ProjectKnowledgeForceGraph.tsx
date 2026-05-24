import * as d3 from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { KnowledgeMapLink, KnowledgeMapNode } from '../../../shared/api/models/project-knowledge-map';
import { knowledgeMapLinkStyles, knowledgeMapNodeStyles } from './knowledge-map.constants';

type GraphNode = KnowledgeMapNode & d3.SimulationNodeDatum;
type GraphLink = Omit<KnowledgeMapLink, 'source' | 'target'> & d3.SimulationLinkDatum<GraphNode>;

type ProjectKnowledgeForceGraphProps = {
  nodes: KnowledgeMapNode[];
  links: KnowledgeMapLink[];
  paused: boolean;
  resetSignal: number;
  onOpenNote: (noteId: string) => void;
};

const DEFAULT_SIZE = { width: 960, height: 640 };

export function ProjectKnowledgeForceGraph({
  nodes,
  links,
  paused,
  resetSignal,
  onOpenNote,
}: ProjectKnowledgeForceGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState(DEFAULT_SIZE);

  const graph = useMemo(() => ({
    nodes: nodes.map((node) => ({ ...node })),
    links: links.map((link) => ({ ...link })),
  }), [links, nodes]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.max(320, Math.floor(rect.width || DEFAULT_SIZE.width)),
        height: Math.max(window.innerWidth < 720 ? 430 : 640, Math.floor(rect.height || 0)),
      });
    };
    updateSize();
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateSize);
    resizeObserver?.observe(element);
    window.addEventListener('resize', updateSize);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return undefined;

    simulationRef.current?.stop();
    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${size.width} ${size.height}`);

    const viewport = svg.append('g').attr('class', 'knowledge-map-viewport');
    const linkLayer = viewport.append('g').attr('class', 'knowledge-map-links');
    const nodeLayer = viewport.append('g').attr('class', 'knowledge-map-nodes');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [size.width, size.height]])
      .scaleExtent([0.25, 3])
      .on('zoom', (event) => {
        viewport.attr('transform', event.transform.toString());
      });
    zoomRef.current = zoom;
    svg.call(zoom);

    const graphNodes = graph.nodes as GraphNode[];
    const graphLinks = graph.links as GraphLink[];
    const link = linkLayer
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(graphLinks)
      .join('line')
      .attr('stroke', (item) => knowledgeMapLinkStyles[item.type].stroke)
      .attr('stroke-opacity', 0.55)
      .attr('stroke-width', (item) => knowledgeMapLinkStyles[item.type].width);

    const node = nodeLayer
      .selectAll<SVGGElement, GraphNode>('g')
      .data(graphNodes)
      .join('g')
      .attr('class', (item) => `knowledge-map-node ${item.type}`)
      .attr('role', (item) => (item.type === 'note' && item.noteId ? 'button' : 'img'))
      .attr('tabindex', (item) => (item.type === 'note' && item.noteId ? 0 : -1))
      .attr('aria-label', (item) => (item.type === 'note' && item.noteId ? `Open note ${item.label}` : `${knowledgeMapNodeStyles[item.type].label} ${item.label}`))
      .on('click', (_event, item) => {
        if (item.type === 'note' && item.noteId) onOpenNote(item.noteId);
      })
      .on('keydown', (event, item) => {
        if (item.type !== 'note' || !item.noteId) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpenNote(item.noteId);
      });

    node
      .append('circle')
      .attr('r', (item) => item.size || knowledgeMapNodeStyles[item.type].radius)
      .attr('fill', (item) => knowledgeMapNodeStyles[item.type].color)
      .attr('stroke', 'rgba(255,255,255,0.74)')
      .attr('stroke-width', 1.2);

    node
      .append('text')
      .attr('class', 'knowledge-map-node-label')
      .attr('x', (item) => (item.size || knowledgeMapNodeStyles[item.type].radius) + 6)
      .attr('y', 4)
      .text((item) => item.label);

    node.append('title').text((item) => [item.label, item.subtitle, item.date].filter(Boolean).join('\n'));

    const simulation = d3.forceSimulation<GraphNode>(graphNodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphLinks).id((item) => item.id).strength((item) => item.strength || 0.2).distance(105))
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(size.width / 2, size.height / 2))
      .force('collide', d3.forceCollide<GraphNode>().radius((item) => (item.size || knowledgeMapNodeStyles[item.type].radius) + 18))
      .on('tick', () => {
        link
          .attr('x1', (item) => graphLinkNode(item.source).x || 0)
          .attr('y1', (item) => graphLinkNode(item.source).y || 0)
          .attr('x2', (item) => graphLinkNode(item.target).x || 0)
          .attr('y2', (item) => graphLinkNode(item.target).y || 0);
        node.attr('transform', (item) => `translate(${item.x || 0},${item.y || 0})`);
      });
    simulationRef.current = simulation;

    const drag = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, item) => {
        if (!event.active) simulation.alphaTarget(0.25).restart();
        item.fx = item.x;
        item.fy = item.y;
      })
      .on('drag', (event, item) => {
        item.fx = event.x;
        item.fy = event.y;
      })
      .on('end', (event, item) => {
        if (!event.active) simulation.alphaTarget(0);
        item.fx = null;
        item.fy = null;
      });
    node.call(drag);

    return () => {
      simulation.stop();
    };
  }, [graph, onOpenNote, size.height, size.width]);

  useEffect(() => {
    const simulation = simulationRef.current;
    if (!simulation) return;
    if (paused) {
      simulation.stop();
      return;
    }
    simulation.alphaTarget(0.12).restart();
    window.setTimeout(() => simulation.alphaTarget(0), 450);
  }, [paused]);

  useEffect(() => {
    const svgElement = svgRef.current;
    const zoom = zoomRef.current;
    if (!svgElement || !zoom) return;
    d3.select(svgElement).call(zoom.transform, d3.zoomIdentity);
    if (!paused) simulationRef.current?.alpha(0.7).restart();
  }, [paused, resetSignal]);

  return (
    <div className="knowledge-map-canvas" ref={containerRef}>
      <svg ref={svgRef} aria-label="Project knowledge map" role="img" />
    </div>
  );
}

function graphLinkNode(value: string | number | GraphNode) {
  return typeof value === 'object' ? value : ({ x: 0, y: 0 } as GraphNode);
}
