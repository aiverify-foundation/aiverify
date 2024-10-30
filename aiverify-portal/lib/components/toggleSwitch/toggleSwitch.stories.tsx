import type { Meta, StoryObj } from '@storybook/react';
import { ToggleSwitch } from './toggleSwitch';
import { userEvent, within, expect } from '@storybook/test';

const meta: Meta<typeof ToggleSwitch> = {
  title: 'Components/Toggle Switch',
  component: ToggleSwitch,
  args: {
    label: 'Toggle Me',
  },
  argTypes: {
    name: {
      table: {
        disable: true,
      },
    },
    value: {
      table: {
        disable: true,
      },
    },
    defaultChecked: {
      table: {
        disable: true,
      },
    },
    onChange: {
      table: {
        disable: true,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleSwitch>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('toggle-switch'));
    await expect(canvas.getByRole('checkbox')).toBeChecked();
    await userEvent.click(canvas.getByRole('toggle-switch'));
    await expect(canvas.getByRole('checkbox')).not.toBeChecked();
  },
};
