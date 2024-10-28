import { Meta, StoryObj } from '@storybook/react';
import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
  title: 'Components/Slider',
  component: Slider,
  argTypes: {
    trackColor: { control: 'color' },
    handleColor: { control: 'color' },
    trackWidth: { control: 'number' },
    trackHeight: { control: 'number' },
    step: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    children: { table: { disable: true } },
    className: { table: { disable: true } },
    onChange: { table: { disable: true } },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 50,
    trackWidth: 400,
    trackHeight: 4,
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: (args) => (
    <Slider {...args}>
      <Slider.Track />
      <Slider.ProgressTrack />
      <Slider.Handle />
      <Slider.Value />
    </Slider>
  ),
};

export const StickyValueDisplay: Story = {
  render: (args) => (
    <Slider {...args}>
      <Slider.Track />
      <Slider.ProgressTrack />
      <Slider.Handle>
        <Slider.Value className="left-1/2 top-[-40px] -translate-x-1/2 transform" />
      </Slider.Handle>
    </Slider>
  ),
};
