import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import type { Plugin } from '@/app/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/lib/components/accordion';
import { TextInput } from '@/lib/components/textInput';
import { getWidgetMdxBundle } from '@/lib/fetchApis/getWidgetMdxBundle';
import { cn } from '@/lib/utils/twmerge';

type PluginsPanelProps = {
  plugins: Plugin[];
  className?: string;
};

async function fetchWidgetMdxBundles(
  plugins: Plugin[],
  setPluginsWithMdx: Dispatch<SetStateAction<Plugin[]>>
) {
  plugins.forEach((plugin, index) => {
    const mdxPromisesForThisPlugin = plugin.widgets.map((widget) =>
      getWidgetMdxBundle(plugin.gid, widget.cid)
    );
    Promise.allSettled(mdxPromisesForThisPlugin).then((mdxResults) => {
      setPluginsWithMdx((prev) => {
        const newPlugins = [...prev];
        const currentPlugin = { ...prev[index] };
        mdxResults.forEach((result, i) => {
          if (
            result.status == 'fulfilled' &&
            result.value.status == 'success'
          ) {
            currentPlugin.widgets[i].mdx = result.value.data;
          }
        });
        return newPlugins;
      });
    });
  });
}

function PlunginsPanel(props: PluginsPanelProps) {
  const { plugins, className } = props;
  const [pluginsWithMdx, setPluginsWithMdx] = useState<Plugin[]>(plugins);

  // TODO - plugins with mdx should be handled at parent component
  useEffect(() => {
    fetchWidgetMdxBundles(plugins, setPluginsWithMdx);
  }, [plugins]);

  const AccordionHero = (
    <Accordion
      type="single"
      className="mt-3"
      collapsible>
      {plugins.map((plugin) => {
        return (
          <AccordionItem
            key={plugin.gid}
            value={`item-${plugin.gid}`}>
            <AccordionTrigger>
              <span className="font-semibold text-gray-200">{plugin.name}</span>
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
    <section className={cn('flex flex-col', className)}>
      <div>
        <TextInput placeholder="Search" />
      </div>
      {AccordionHero}
    </section>
  );
}

export { PlunginsPanel };
