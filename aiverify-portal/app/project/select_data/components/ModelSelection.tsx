'use client';

import { useEffect, useState } from 'react';

interface ModelSelectionProps {
  projectId?: string | null;
  selectedModelId?: string;
  onModelChange: (modelId: string | undefined) => void;
}

interface Model {
  id: string;
  name: string;
  created_at: string;
}

export default function ModelSelection({
  projectId,
  selectedModelId,
  onModelChange,
}: ModelSelectionProps) {
  const [models, setModels] = useState<Model[]>([]);

  // Fetch models on mount
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch('/api/models');
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        setModels(data);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    }
    fetchModels();
  }, []);

  return (
    <div className="rounded-lg bg-[#2D3142] p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">AI Model</h2>
          <p className="text-sm text-gray-400">
            Upload new AI Model or select existing AI Model.
          </p>
        </div>
        <button
          className="rounded bg-[#4B5563] px-4 py-2 text-sm text-gray-300 hover:bg-[#374151]"
          onClick={() => {}}>
          ADD NEW AI MODEL
        </button>
      </div>

      <div className="relative">
        <select
          value={selectedModelId || ''}
          onChange={(e) => onModelChange(e.target.value || undefined)}
          className="w-full cursor-pointer appearance-none rounded bg-[#1F2937] p-3 pr-10 text-gray-300">
          <option value="">Choose Model</option>
          {models.map((model) => (
            <option
              key={model.id}
              value={model.id}>
              {model.name} - {new Date(model.created_at).toLocaleDateString()}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
          <svg
            className="h-4 w-4 fill-current text-gray-400"
            viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
