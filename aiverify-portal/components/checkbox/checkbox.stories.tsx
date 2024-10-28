import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';
import { userEvent, within, expect } from '@storybook/test';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    controls: {
      sort: 'requiredFirst',
      expanded: false,
    },
  },
  args: {
    label: 'Your Checkbox',
    disabled: false,
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Label of the checkbox',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state of the checkbox',
      table: {
        type: {
          summary: 's | l',
        },
        defaultValue: {
          summary: 'false',
        },
      },
    },
    size: {
      description: 'The size of the checkbox. There are 2 sizes built in.',
      table: {
        type: {
          summary: '"s" - small or "l" - large',
        },
        defaultValue: {
          summary: 's',
        },
      },
    },
    labelClassName: {
      description: 'Custom CSS classes for the label. Tailwind CSS classes are recommended.',
      table: {
        type: {
          summary: 'string',
        },
        defaultValue: {
          summary: 'undefined',
        },
      },
    },
    error: {
      table: {
        disable: true,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    label: 'Your Checkbox',
    size: 'l',
    name: 'your-checkbox',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('checkbox'));
    await expect(canvas.getByRole('checkbox')).toBeChecked();
    await userEvent.click(canvas.getByRole('checkbox'));
    await expect(canvas.getByRole('checkbox')).not.toBeChecked();
  },
};

export const ErrorState: Story = {
  args: {
    label: 'Your Checkbox',
    size: 'l',
    name: 'your-checkbox',
    error: 'This is an error message',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('This is an error message')).toBeInTheDocument();
  },
};

export const DisabledState: Story = {
  args: {
    label: 'Your Checkbox',
    size: 'l',
    name: 'your-checkbox',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole('checkbox')).toBeDisabled();
    await userEvent.click(canvas.getByRole('checkbox'));
    await expect(canvas.getByRole('checkbox')).not.toBeChecked();
  },
};
