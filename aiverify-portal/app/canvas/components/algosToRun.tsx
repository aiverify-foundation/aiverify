import { RiFlaskLine } from '@remixicon/react';
import { Algorithm } from '@/app/types';
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
  algos: Record<string, Algorithm[]>;
};

function AlgosToRun(props: AlgosToRunProps) {
  const { algos, className } = props;

  const AccordionHero = (
    <Accordion
      type="single"
      collapsible
      className="w-full">
      {Object.keys(algos).length > 0 &&
        Object.keys(algos).map((algoCids) => {
          return (
            <AccordionItem
              key={algoCids}
              value={`item-${algoCids}`}>
              <AccordionTrigger>
                <span className="font-semibold text-gray-200">
                  {algos[algoCids][0].name}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <section className="flex flex-col gap-2">
                  {algos[algoCids].map((algo) => {
                    return (
                      <div
                        key={algo.cid}
                        className="rounded-md p-2 text-gray-400">
                        {algo.description}
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
    <div
      className={cn(
        'flex flex-col items-center gap-2 break-words rounded-lg bg-gray-300 p-2 shadow-lg',
        className
      )}>
      <Popover>
        <PopoverTrigger>
          <RiFlaskLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
        </PopoverTrigger>
        <PopoverContent
          side="left"
          sideOffset={40}
          alignOffset={100}
          className="w-[320px] bg-secondary-900">
          <div>
            <h1 className="mb-2 text-[1rem] font-semibold text-white">
              Tests to run
            </h1>
            {AccordionHero}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { AlgosToRun };
