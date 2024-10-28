import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './card';
import { Icon, IconName } from '../IconSVG';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'absolute',
          top: 0,
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      table: {
        disable: true,
      },
    },
    className: {
      table: {
        disable: true,
      },
    },
    cardColor: {
      table: {
        disable: true,
      },
    },
    height: {
      table: {
        disable: true,
      },
    },
    style: {
      table: {
        disable: true,
      },
    },
    children: {
      table: {
        disable: true,
      },
    },
    onClick: {
      table: {
        disable: true,
      },
    },
  },
  args: {
    disableTiltEffect: false,
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    className: 'text-white flex flex-col gap-2 justify-between p-6',
    onClick: () => {
      alert('clicked');
    },
  },
  render: (args) => (
    <div className="flex gap-4">
      <Card {...args}>
        <Icon name={IconName.SolidBox} size={45} svgClassName="fill-white dark:fill-white" />
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </div>
      </Card>
      <Card {...args}>
        <Icon
          name={IconName.ChatBubbleWide}
          size={45}
          svgClassName="stroke-white dark:stroke-white"
        />
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </div>
      </Card>
      <Card {...args}>
        <Icon name={IconName.LightBulb} size={45} svgClassName="fill-white dark:fill-white" />
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </div>
      </Card>
    </div>
  ),
};
