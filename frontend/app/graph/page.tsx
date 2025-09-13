"use client";
import { useEffect, useRef } from "react";

export default function GraphPage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Placeholder: you can swap with Cytoscape.js when available
    // Minimal visual for demo without extra deps
    const el = ref.current;
    if (!el) return;
    el.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.width = el.clientWidth;
    canvas.height = 400;
    el.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const nodes = [
      { x: 80, y: 200, label: "You" },
      { x: 260, y: 120, label: "Alice" },
      { x: 260, y: 280, label: "Bob" },
      { x: 440, y: 200, label: "Climbing" },
    ];
    const edges: [number, number][] = [ [0,1], [0,2], [1,3], [2,3] ];
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    edges.forEach(([a,b]) => { const na = nodes[a], nb = nodes[b]; ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke(); });
    nodes.forEach(n => { ctx.fillStyle = "#0ea5e9"; ctx.beginPath(); ctx.arc(n.x, n.y, 16, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#111827"; ctx.font = "12px sans-serif"; ctx.fillText(n.label, n.x-20, n.y-22); });
  }, []);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Graph</h1>
      <p className="text-sm text-muted-foreground">People, topics, and shared interests (demo).</p>
      <div ref={ref} className="w-full rounded border p-2" />
    </div>
  );
}

