import type { Meta, StoryObj } from '@storybook/react';
import { Icon, IconName } from '.';
import { fillIcons, lineIcons } from './categories';

const meta: Meta<typeof Icon> = {
  title: 'Components/SVG Icons',
  component: Icon,
  parameters: {
    controls: {
      sort: 'requiredFirst',
      expanded: true,
    },
  },
  argTypes: {
    name: {
      control: 'select',
      options: Object.values(IconName).sort(),
      description: 'Name of the icon',
    },
    size: {
      control: 'number',
      description: 'Size of the icon in CSS px',
    },
    svgClassName: {
      control: 'text',
      description: 'Class name for the SVG',
      table: {
        type: { summary: 'string' },
        disable: true,
      },
    },
    role: {
      table: {
        disable: true,
      },
    },
    ariaLabel: {
      table: {
        disable: true,
      },
    },
    style: {
      table: {
        disable: true,
      },
    },
    onMouseDown: {
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
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Line_Icon: Story = {
  argTypes: {
    name: {
      control: 'select',
      options: lineIcons.sort(),
      description: 'Name of the icon',
    },
  },
  args: {
    name: IconName.Alert,
    size: 50,
    svgClassName: 'stroke-primary-900 dark:stroke-primary-50',
    onClick: () => alert('Icon clicked'),
  },
};

export const Fill_Icon: Story = {
  argTypes: {
    name: {
      control: 'select',
      options: fillIcons.sort(),
      description: 'Name of the icon',
    },
  },
  args: {
    name: IconName.Bell,
    size: 50,
    svgClassName: 'fill-primary-900 dark:fill-primary-50',
    onClick: () => alert('Icon clicked'),
  },
};

export const Color_Icon: Story = {
  args: {
    name: IconName.Folder,
    size: 50,
    svgClassName: 'fill-primary-900 dark:fill-primary-50',
    onClick: () => alert('Icon clicked'),
  },
  argTypes: {
    name: {
      control: 'select',
      options: [IconName.Folder, IconName.FolderForChatSessions],
      description: 'Name of the icon',
    },
  },
};
