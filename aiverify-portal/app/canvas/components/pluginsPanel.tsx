import type { PluginForGridLayout } from '@/app/canvas/types';
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
};

function PlunginsPanel(props: PluginsPanelProps) {
  const { plugins, className } = props;

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
