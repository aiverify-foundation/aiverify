import Link from 'next/link';
import { Card } from '@/lib/components/card/card';

function BlankCanvasCard() {
  return (
    <Link href="/canvas">
      <Card
        size="md"
        width={450}
        className="cursor-pointer !bg-none text-white text-shadow-sm hover:outline hover:outline-1 hover:outline-primary-400 [&&]:bg-secondary-900">
        <Card.Content className="flex flex-col gap-7 p-4">
          <h3 className="text-mainpurple text-[1.2rem] font-bold">
            Blank Canvas
          </h3>
          <p>Design your own report by dragging widgets onto a blank canvas.</p>
        </Card.Content>
      </Card>
    </Link>
  );
}

export { BlankCanvasCard };
