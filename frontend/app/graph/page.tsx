"use client";
import GraphView from "@/components/GraphView";

export default function GraphPage() {
  return (
    <div className="container mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold mb-4">People & Interests Graph</h1>
      <GraphView />
    </div>
  );
}

