'use client';

import Link from 'next/link';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Card } from '@/lib/components/card/card';

export function UserManageFlowCards() {
  return (
    <section className="flex w-full justify-center">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Link href="/models">
          <Card
            size="md"
            width={320}
            height={320 * 0.6}
            enableTiltEffect={true}
            tiltSpeed={200}
            tiltRotation={5}
            enableTiltGlare={true}
            tiltMaxGlare={0.3}
            className="bg-secondary-500 !bg-none">
            <Card.Content className="flex flex-col justify-between p-6">
              <Icon
                name={IconName.Document}
                size={50}
                color="white"
              />
              <div>
                <p className="tracking-wide text-shadow-sm">Manage Models</p>
                <h2 className="text-2xl font-bold tracking-wide text-shadow-sm">
                  Models
                </h2>
              </div>
            </Card.Content>
          </Card>
        </Link>
        <Link href="/datasets">
          <Card
            size="md"
            width={320}
            height={320 * 0.6}
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
                <p className="tracking-wide text-shadow-sm">Manage datasets</p>
                <h2 className="text-2xl font-bold tracking-wide text-shadow-sm">
                  Data
                </h2>
              </div>
            </Card.Content>
          </Card>
        </Link>
        <Link href="/templates">
          <Card
            size="md"
            width={320}
            height={320 * 0.6}
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
                <p className="tracking-wide text-shadow-sm">
                  Manage report templates
                </p>
                <h2 className="text-2xl font-bold tracking-wide text-shadow-sm">
                  Report Templates
                </h2>
              </div>
            </Card.Content>
          </Card>
        </Link>
        <Link href="/inputs">
          <Card
            size="md"
            width={320}
            height={320 * 0.6}
            enableTiltEffect={true}
            tiltSpeed={200}
            tiltRotation={5}
            enableTiltGlare={true}
            tiltMaxGlare={0.3}
            className="bg-secondary-500 !bg-none">
            <Card.Content className="flex flex-col justify-between p-6">
              <Icon
                name={IconName.File}
                size={50}
                color="white"
              />
              <div>
                <p className="tracking-wide text-shadow-sm">
                  Manage user inputs
                </p>
                <h2 className="text-2xl font-bold tracking-wide text-shadow-sm">
                  User Inputs
                </h2>
              </div>
            </Card.Content>
          </Card>
        </Link>
        <Link href="/plugins">
          <Card
            size="md"
            width={320}
            height={320 * 0.6}
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
                <p className="tracking-wide text-shadow-sm">Manage plugins</p>
                <h2 className="text-2xl font-bold tracking-wide text-shadow-sm">
                  Plugins
                </h2>
              </div>
            </Card.Content>
          </Card>
        </Link>
        <Link href="/results">
          <Card
            size="md"
            width={320}
            height={320 * 0.6}
            enableTiltEffect={true}
            tiltSpeed={200}
            tiltRotation={5}
            enableTiltGlare={true}
            tiltMaxGlare={0.3}
            className="bg-secondary-500 !bg-none">
            <Card.Content className="flex flex-col justify-between p-6">
              <Icon
                name={IconName.Lightning}
                size={50}
                color="white"
              />
              <div>
                <p className="tracking-wide text-shadow-sm">
                  Manage test results
                </p>
                <h2 className="text-2xl font-bold tracking-wide text-shadow-sm">
                  Test Results
                </h2>
              </div>
            </Card.Content>
          </Card>
        </Link>
      </div>
    </section>
  );
}
