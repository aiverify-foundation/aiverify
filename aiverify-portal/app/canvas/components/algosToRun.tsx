import { RiFlaskLine } from '@remixicon/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/lib/components/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/lib/components/popover';
import { cn } from '@/lib/utils/twmerge';

type AlgosToRunProps = {
  className?: string;
  disabled?: boolean;
  algos: Algorithm[];
  onClick: () => void;
};

function AlgosToRun(props: AlgosToRunProps) {
  const { algos, className, disabled, onClick } = props;

  // const AccordionHero = (
  //   <Accordion
  //     type="single"
  //     collapsible>
  //     {algos.map((plugin) => {
  //       return (
  //         <AccordionItem
  //           key={plugin.gid}
  //           value={`item-${plugin.gid}`}>
  //           <AccordionTrigger>
  //             <span className="font-semibold text-gray-200">{plugin.name}</span>
  //           </AccordionTrigger>
  //           <AccordionContent>
  //             <section className="flex flex-col gap-2">
  //               {plugin.widgets.map((widget) => {
  //                 return (
  //                   <div
  //                     key={widget.cid}
  //                     draggable={true}
  //                     onDragStart={(e) => {
  //                       e.dataTransfer.setData(
  //                         'application/json',
  //                         JSON.stringify({
  //                           gid: plugin.gid,
  //                           cid: widget.cid,
  //                         })
  //                       );
  //                       e.dataTransfer.effectAllowed = 'copy';
  //                     }}
  //                     className="cursor-grab rounded-md border border-gray-400 p-2 text-gray-400 hover:bg-secondary-1000 active:cursor-grabbing">
  //                     {widget.name}
  //                   </div>
  //                 );
  //               })}
  //             </section>
  //           </AccordionContent>
  //         </AccordionItem>
  //       );
  //     })}
  //   </Accordion>
  // );

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg bg-gray-300 p-2 shadow-lg',
        className
      )}>
      <Popover>
        <PopoverTrigger>
          <RiFlaskLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
        </PopoverTrigger>
        <PopoverContent
          side="left"
          sideOffset={40}
          alignOffset={100}>
          <div>
            <h1>Tests to run</h1>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { AlgosToRun };
