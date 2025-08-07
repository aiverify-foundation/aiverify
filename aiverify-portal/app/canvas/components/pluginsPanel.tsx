'use client';
import Fuse from 'fuse.js';
import { useEffect, useState } from 'react';
import type {
  PluginForGridLayout,
  WidgetOnGridLayout,
} from '@/app/canvas/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/lib/components/accordion';
import { TextInput } from '@/lib/components/textInput';
import { cn } from '@/lib/utils/twmerge';

type PluginsPanelProps = {
  plugins: PluginForGridLayout[];
  className?: string;
  onDragStart: (widget: WidgetOnGridLayout) => void;
  onDragEnd: () => void;
};

function PluginsPanel(props: PluginsPanelProps) {
  const { plugins, className, onDragStart, onDragEnd } = props;
  const [searchValue, setSearchValue] = useState('');
  const [sortedPlugins, setSortedPlugins] = useState<PluginForGridLayout[]>([]);

  useEffect(() => {
    const sorted = plugins
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((plugin) => ({
        ...plugin,
        widgets: (plugin.widgets || []).sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      }));

    if (!searchValue.trim()) {
      setSortedPlugins(sorted);
      return;
    }

    const fuse = new Fuse(sorted, {
      keys: ['name', 'widgets.name', 'widgets.description'],
      threshold: 0.3,
      ignoreLocation: true,
      includeMatches: true,
    });

    const results = fuse.search(searchValue);
    setSortedPlugins(results.map((result) => result.item));
  }, [plugins, searchValue]);

  const AccordionHero = (
    <Accordion
      type="single"
      collapsible>
      {sortedPlugins.map((plugin) => {
        return (
          <AccordionItem
            key={plugin.gid}
            value={`item-${plugin.gid}`}>
            <AccordionTrigger>
              <div className="flex items-center gap-2 font-semibold text-gray-200">
                <div>{plugin.name}</div>
                <div className="text-xs text-gray-400">
                  {plugin.widgets.length} {plugin.widgets.length === 1 ? 'widget' : 'widgets'}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <section className="flex flex-col gap-2">
                {plugin.widgets.map((widget) => {
                  return (
                    <div
                      key={widget.cid}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          'application/json',
                          JSON.stringify({
                            gid: plugin.gid,
                            cid: widget.cid,
                          })
                        );
                        e.dataTransfer.effectAllowed = 'copy';
                        onDragStart(widget);
                      }}
                      onDragEnd={() => {
                        onDragEnd();
                      }}
                      className="cursor-grab rounded-md border border-gray-400 p-2 text-gray-400 hover:bg-secondary-1000 active:cursor-grabbing">
                      {widget.name}
                    </div>
                  );
                })}
              </section>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );

  return (
    <section data-testid="plugins-panel" className={cn('flex flex-col', className)}>
      <div>
        <TextInput
          data-testid="search-input"
          placeholder="Search plugins..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
      <div className="custom-scrollbar mr-[-10px] max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
        {AccordionHero}
      </div>
    </section>
  );
}

export { PluginsPanel };
