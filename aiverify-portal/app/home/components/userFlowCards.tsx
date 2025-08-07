'use client';

import Link from 'next/link';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Card } from '@/lib/components/card/card';

export function UserFlowCards() {
  return (
    <section className="flex w-full justify-start" data-testid="user-flow-cards">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Link href="/project/new">
          <Card
            size="sm"
            width={320}
            height={320*0.6}
            enableTiltEffect={true}
            tiltSpeed={200}
            tiltRotation={5}
            enableTiltGlare={true}
            tiltMaxGlare={0.3}
            className="bg-secondary-500 !bg-none">
            <Card.Content className="flex flex-col justify-between p-6">
              <Icon
                name={IconName.OpenedBook}
                size={50}
                color="white"
              />
              <div>
                <p className="text-shadow-sm tracking-wide">
                  Test an AI Model and generate reports
                </p>
                <h2 className="text-shadow-sm text-2xl font-bold tracking-wide">
                  Create New Project
                </h2>
              </div>
            </Card.Content>
          </Card>
        </Link>
        <Link href="/home/manage">
          <Card
            size="md"
            width={320}
            height={320*0.6}
            enableTiltEffect={true}
            tiltSpeed={200}
            tiltRotation={5}
            enableTiltGlare={true}
            tiltMaxGlare={0.3}
            className="bg-secondary-500 !bg-none">
            <Card.Content className="flex flex-col justify-between p-6">
            <div style={{ height: 50 }} /> {/* Empty placeholder for spacing */}
              <div>
                <p className="text-shadow-sm tracking-wide">Manage Models, Datasets, etc</p>
                <h2 className="text-shadow-sm text-2xl font-bold tracking-wide">
                  Manage
                </h2>
              </div>
            </Card.Content>
          </Card>
        </Link>
      </div>
    </section>
  );
}
