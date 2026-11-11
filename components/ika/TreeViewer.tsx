'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Hash, ListFilter, Sparkles } from 'lucide-react';
import type { IndikatorNode } from '@/lib/types';

interface TreeNodeProps {
  node: IndikatorNode;
  level: number;
}

function TreeNodeItem({ node, level }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;

  const getLevelBadge = (lvl: string) => {
    switch (lvl) {
      case 'SKA':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200';
      case 'IKA':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200';
      case 'KOMPONEN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200';
      case 'SUB':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200';
      case 'LEAF':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTipeBadge = (tipe: string) => {
    switch (tipe) {
      case 'ANGKA':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <Hash className="w-3 h-3" /> ANGKA
          </span>
        );
      case 'PREDIKAT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <ListFilter className="w-3 h-3" /> PREDIKAT
          </span>
        );
      case 'TURUNAN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            <Sparkles className="w-3 h-3" /> TURUNAN
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col">
      <div
        className={`flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-colors ${
          level === 0 ? 'bg-slate-50 dark:bg-slate-900 font-semibold' : ''
        }`}
        style={{ paddingLeft: `${Math.max(12, level * 24)}px` }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Toggle node"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getLevelBadge(
              node.level
            )}`}
          >
            {node.level}
          </span>

          <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
            {node.kode}
          </span>

          <span className="text-xs text-slate-800 dark:text-slate-200 truncate">
            {node.nama}
          </span>

          {node.catatan && (
            <span className="text-[10px] italic text-slate-400 dark:text-slate-500 truncate max-w-xs">
              ({node.catatan})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          {getTipeBadge(node.tipe_input)}
          <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
            Bobot: {node.bobot}
          </span>
          {node.cap_100 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 font-mono">
              Cap 100
            </span>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="flex flex-col">
          {node.children!.map((child) => (
            <TreeNodeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeViewer({ nodes }: { nodes: IndikatorNode[] }) {
  // Susun pohon berjenjang
  const nodeMap = new Map<string, IndikatorNode>();
  const rootNodes: IndikatorNode[] = [];

  nodes.forEach((n) => {
    nodeMap.set(n.id, { ...n, children: [] });
  });

  nodes.forEach((n) => {
    const current = nodeMap.get(n.id)!;
    if (n.parent_id && nodeMap.has(n.parent_id)) {
      nodeMap.get(n.parent_id)!.children!.push(current);
    } else {
      rootNodes.push(current);
    }
  });

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Struktur Pohon Indikator Kinerja Antara (IKA)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Struktur berjenjang SKA → IKA → Komponen → Sub-Komponen → Leaf Node (Total: {nodes.length} Node)
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
        {rootNodes.map((root) => (
          <TreeNodeItem key={root.id} node={root} level={0} />
        ))}
      </div>
    </div>
  );
}
