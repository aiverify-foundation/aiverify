import Link from 'next/link';
import { TestModel } from '@/app/models/utils/types';
import { Button, ButtonVariant } from '@/lib/components/button';

interface ModelSelectionProps {
  projectId?: string | null;
  selectedModelId?: string;
  onModelChange: (modelId: string | undefined) => void;
  models: TestModel[];
  flow: string;
}

export default function ModelSelection({
  selectedModelId,
  onModelChange,
  models,
  projectId,
  flow,
}: ModelSelectionProps) {
  return (
    <div className="rounded-lg border border-secondary-500 bg-secondary-950 p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">AI Model</h2>
          <p className="text-sm text-white">
            Upload new AI Model or select existing AI Model.
          </p>
        </div>
      </div>

      <div className="relative">
        <select
          value={selectedModelId || ''}
          onChange={(e) => onModelChange(e.target.value || undefined)}
          className="w-full cursor-pointer appearance-none rounded bg-secondary-900 p-3 pr-10 text-white">
          <option value="">Choose Model</option>
          {models.map((model) => (
            <option
              key={model.id}
              value={model.id}>
              {model.name}
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
      <div className="mt-4 flex justify-end">
        <Link
          href={`/models/upload?flow=${flow}${projectId ? `&projectId=${projectId}` : ''}`}>
          <Button
            variant={ButtonVariant.OUTLINE}
            textColor="white"
            hoverColor="var(--color-primary-500)"
            text="ADD NEW AI MODEL"
            size="xs"
            pill
          />
        </Link>
      </div>
    </div>
  );
}
