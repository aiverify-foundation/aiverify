'use client';

import Link from 'next/link';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Card } from '@/lib/components/card/card';

export function UserFlowCards() {
  return (
    <section className="flex w-full justify-center">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Link href="/projects">
          <Card
            size="md"
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
        <Link href="/models">
          <Card
            size="md"
            enableTiltEffect={true}
            tiltSpeed={200}
            tiltRotation={5}
            enableTiltGlare={true}
            tiltMaxGlare={0.3}
            className="bg-secondary-500 !bg-none">
            <Card.Content className="flex flex-col justify-between p-6">
              <Icon
                name={IconName.Database}
                size={50}
                color="white"
              />
              <div>
                <p className="text-shadow-sm tracking-wide">Manage Models</p>
                <h2 className="text-shadow-sm text-2xl font-bold tracking-wide">
                  Models
                </h2>
              </div>
            </Card.Content>
          </Card>
        </Link>
        <Link href="/data">
          <Card
            size="md"
            enableTiltEffect={true}
            tiltSpeed={200}
            tiltRotation={5}
            enableTiltGlare={true}
            tiltMaxGlare={0.3}
            className="bg-secondary-500 !bg-none">
            <Card.Content className="flex flex-col justify-between p-6">
              <Icon
                name={IconName.Database}
                size={50}
                color="white"
              />
              <div>
                <p className="text-shadow-sm tracking-wide">Manage datasets</p>
                <h2 className="text-shadow-sm text-2xl font-bold tracking-wide">
                  Data
                </h2>
              </div>
            </Card.Content>
          </Card>
        </Link>
        <Link href="/report-templates">
          <Card
            size="md"
            enableTiltEffect={true}
            tiltSpeed={200}
            tiltRotation={5}
            enableTiltGlare={true}
            tiltMaxGlare={0.3}
            className="bg-secondary-500 !bg-none">
            <Card.Content className="flex flex-col justify-between p-6">
              <Icon
                name={IconName.OpenedEmptyBook}
                size={50}
                color="white"
              />
              <div>
                <p className="text-shadow-sm tracking-wide">
                  Manage report templates
                </p>
                <h2 className="text-shadow-sm text-2xl font-bold tracking-wide">
                  Report Templates
                </h2>
              </div>
            </Card.Content>
          </Card>
        </Link>
        <Link href="/plugins">
          <Card
            size="md"
            enableTiltEffect={true}
            tiltSpeed={200}
            tiltRotation={5}
            enableTiltGlare={true}
            tiltMaxGlare={0.3}
            className="bg-secondary-500 !bg-none">
            <Card.Content className="flex flex-col justify-between p-6">
              <Icon
                name={IconName.Plug}
                size={50}
                color="white"
              />
              <div>
                <p className="text-shadow-sm tracking-wide">Manage plugins</p>
                <h2 className="text-shadow-sm text-2xl font-bold tracking-wide">
                  Plugins
                </h2>
              </div>
            </Card.Content>
          </Card>
        </Link>
      </div>
    </section>
  );
}
