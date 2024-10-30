import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './card';
import React from 'react';
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
          padding: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
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
      control: 'color',
    },
    width: {
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
    enableTiltEffect: {
      table: {
        disable: true,
      },
    },
  },
  parameters: {
    options: {
      storySort: {
        order: [
          'Components/Card/Default',
          'Components/Card/SmallSizeVariant',
          'Components/Card/MediumSizeVariant',
          'Components/Card/LargeSizeVariant',
          'Components/Card/WithTiltEffect',
          'Components/Card/SideBar',
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  argTypes: {
    width: {
      table: {
        disable: false,
      },
    },
  },
  args: {
    width: 380,
    enableTiltEffect: true,
    tiltRotation: 5,
    tiltSpeed: 200,
    enableTiltGlare: true,
    tiltMaxGlare: 0.3,
    onClick: () => {
      alert('clicked');
    },
    className: 'text-white text-shadow-sm',
  },
  render: (args) => (
    <React.Fragment>
      <Card {...args}>
        <Card.Content className="flex flex-col justify-between p-6">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p className="">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </Card.Content>
      </Card>
      <Card {...args}>
        <Card.Content className="flex flex-col justify-between p-6">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </Card.Content>
      </Card>
      <Card {...args}>
        <Card.Content className="flex flex-col justify-between p-6">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </Card.Content>
      </Card>
      <Card {...args}>
        <Card.Content className="flex flex-col justify-between p-6">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </Card.Content>
      </Card>
    </React.Fragment>
  ),
};

export const SmallSizeVariant: Story = {
  args: {
    size: 'sm',
    onClick: () => {
      alert('clicked');
    },
  },
  render: (args) => (
    <React.Fragment>
      <Card {...args} className="text-white">
        <Card.Content className="p-4">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
            porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
          </p>
        </Card.Content>
      </Card>
      <Card {...args} className="text-white">
        <Card.Content className="p-6">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
            porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
          </p>
        </Card.Content>
      </Card>
      <Card {...args} className="text-white">
        <Card.Content className="p-6">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
            porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
          </p>
        </Card.Content>
      </Card>
      <Card {...args} className="text-white">
        <Card.Content className="p-6">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
            porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
          </p>
        </Card.Content>
      </Card>
    </React.Fragment>
  ),
};

export const MediumSizeVariant: Story = {
  args: {
    size: 'md',
    onClick: () => {
      alert('clicked');
    },
  },
  render: (args) => (
    <React.Fragment>
      <Card {...args} className="text-white">
        <Card.Content className="p-4">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
            porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
          </p>
        </Card.Content>
      </Card>
      <Card {...args} className="text-white">
        <Card.Content className="p-6">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
            porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
          </p>
        </Card.Content>
      </Card>
      <Card {...args} className="text-white">
        <Card.Content className="p-6">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
            porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
          </p>
        </Card.Content>
      </Card>
      <Card {...args} className="text-white">
        <Card.Content className="p-6">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
            porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
          </p>
        </Card.Content>
      </Card>
    </React.Fragment>
  ),
};

export const LargeSizeVariant: Story = {
  args: {
    size: 'lg',
    onClick: () => {
      alert('clicked');
    },
  },
  render: (args) => (
    <React.Fragment>
      <Card {...args} className="text-white">
        <Card.Content className="flex flex-col justify-between p-6">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </Card.Content>
      </Card>
      <Card {...args} className="text-white">
        <Card.Content className="flex flex-col justify-between p-6">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </Card.Content>
      </Card>
      <Card {...args} className="text-white">
        <Card.Content className="flex flex-col justify-between p-6">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </Card.Content>
      </Card>
      <Card {...args} className="text-white">
        <Card.Content className="flex flex-col justify-between p-6">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </Card.Content>
      </Card>
    </React.Fragment>
  ),
};

export const WithTiltEffect: Story = {
  argTypes: {
    cardColor: {
      table: {
        disable: true,
      },
    },
    enableTiltEffect: {
      table: {
        disable: true,
      },
    },
    enableTiltGlare: {
      control: 'boolean',
      table: {
        disable: false,
      },
    },
    tiltMaxGlare: {
      control: 'number',
      step: 0.1,
      table: {
        disable: false,
      },
    },
    tiltRotation: {
      control: 'number',
      step: 1,
      table: {
        disable: false,
      },
    },
    tiltSpeed: {
      control: 'number',
      step: 10,
      table: {
        disable: false,
      },
    },
  },
  args: {
    enableTiltEffect: true,
    tiltSpeed: 400,
    tiltRotation: 10,
    enableTiltGlare: true,
    tiltMaxGlare: 0.3,
  },
  render: (args) => (
    <React.Fragment>
      <Card {...args} className="text-white">
        <Card.Content className="flex flex-col justify-between p-6">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </Card.Content>
      </Card>
      <Card {...args} className="text-white">
        <Card.Content className="flex flex-col justify-between p-6">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </Card.Content>
      </Card>
      <Card {...args} className="text-white">
        <Card.Content className="flex flex-col justify-between p-6">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </Card.Content>
      </Card>
      <Card {...args} className="text-white">
        <Card.Content className="flex flex-col justify-between p-6">
          <h2 className="text-[1.2rem] font-bold">Card Title</h2>
          <figcaption>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
              porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
            </p>
          </figcaption>
        </Card.Content>
      </Card>
    </React.Fragment>
  ),
};

export const SideBar: Story = {
  args: {
    className: 'text-white text-shadow-sm',
  },
  render: (args) => (
    <React.Fragment>
      <Card {...args} size="lg">
        <Card.SideBar
          className="flex flex-col items-center 
        gap-4 border-r border-x-primary-600
        border-r-primary-600 py-4"
        >
          <Icon
            size={25}
            name={IconName.SolidBox}
            svgClassName="fill-primary-300 dark:fill-primary-300"
          />
          <Icon
            size={27}
            name={IconName.HistoryClock}
            svgClassName="fill-primary-300 dark:fill-primary-300"
          />
          <Icon
            size={27}
            name={IconName.Tools}
            svgClassName="fill-primary-300 dark:fill-primary-300"
          />
        </Card.SideBar>
        <Card.Content className="flex flex-col gap-7 p-4">
          <h3 className="text-[1.2rem] font-bold">Card Title</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
            porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
          </p>
        </Card.Content>
      </Card>

      <Card {...args}>
        <Card.Content className="flex flex-col gap-7 p-4">
          <h3 className="text-[1.2rem] font-bold">Card Title</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
            porttitor, cursus auctor elit eleifend. Fusce ultricies ultrices sagittis.
          </p>
        </Card.Content>
        <Card.SideBar
          className="flex flex-col items-center 
        gap-4 border-l border-x-primary-600
        border-r-primary-600 py-4"
        >
          <Icon
            size={25}
            name={IconName.SolidBox}
            svgClassName="fill-primary-300 dark:fill-primary-300"
          />
          <Icon
            size={27}
            name={IconName.HistoryClock}
            svgClassName="fill-primary-300 dark:fill-primary-300"
          />
          <Icon
            size={27}
            name={IconName.Tools}
            svgClassName="fill-primary-300 dark:fill-primary-300"
          />
        </Card.SideBar>
      </Card>

      <Card {...args} size="sm">
        <Card.SideBar
          className="flex flex-col items-center 
        gap-4 border-r border-x-primary-600
        border-r-primary-600 py-4"
        >
          <Icon
            size={18}
            name={IconName.SolidBox}
            svgClassName="fill-primary-300 dark:fill-primary-300"
          />
          <Icon
            size={20}
            name={IconName.HistoryClock}
            svgClassName="fill-primary-300 dark:fill-primary-300"
          />
          <Icon
            size={20}
            name={IconName.Tools}
            svgClassName="fill-primary-300 dark:fill-primary-300"
          />
        </Card.SideBar>
        <Card.Content className="flex flex-col gap-2 p-3">
          <h3 className="text-[1rem] font-bold">Card Title</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut maximus purus sed velit
            porttitor, cursus auctor elit eleifend.
          </p>
        </Card.Content>
      </Card>
    </React.Fragment>
  ),
};
