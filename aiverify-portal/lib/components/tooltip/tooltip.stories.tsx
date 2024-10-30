import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip, TooltipPosition } from '.';
import { TextInput } from '../textInput';

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  args: {
    content: 'Hello World. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    offsetLeft: 0,
    offsetTop: 0,
  },
  argTypes: {
    content: {
      table: {
        disable: true,
      },
    },
    position: {
      table: {
        disable: true,
      },
    },
    flash: {
      table: {
        disable: true,
      },
    },
    flashDuration: {
      table: {
        disable: true,
      },
    },
    defaultShow: {
      table: {
        disable: true,
      },
    },
    delay: {
      table: {
        disable: true,
      },
    },
    disabled: {
      table: {
        disable: true,
      },
    },
    transparent: {
      table: {
        disable: true,
      },
    },
    contentMaxWidth: {
      table: {
        disable: true,
      },
    },
    contentMinWidth: {
      table: {
        disable: true,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    position: TooltipPosition.top,
  },

  render: (args) => (
    <Tooltip {...args}>
      <div
        style={{
          backgroundColor: 'skyblue',
          padding: 10,
          borderRadius: 4,
          border: '1px solid black',
          cursor: 'pointer',
        }}
      >
        Hover over me
      </div>
    </Tooltip>
  ),
};

export const LeftPosition: Story = {
  args: {
    position: TooltipPosition.left,
  },

  render: (args) => (
    <Tooltip {...args}>
      <div
        style={{
          backgroundColor: 'skyblue',
          padding: 10,
          borderRadius: 4,
          border: '1px solid black',
          cursor: 'pointer',
        }}
      >
        Hover over me
      </div>
    </Tooltip>
  ),
};

export const RightPosition: Story = {
  args: {
    position: TooltipPosition.right,
  },

  render: (args) => (
    <Tooltip {...args}>
      <div
        style={{
          backgroundColor: 'skyblue',
          padding: 10,
          borderRadius: 4,
          border: '1px solid black',
          cursor: 'pointer',
        }}
      >
        Hover over me
      </div>
    </Tooltip>
  ),
};

export const BottomPosition: Story = {
  args: {
    position: TooltipPosition.bottom,
  },

  render: (args) => (
    <Tooltip {...args}>
      <div
        style={{
          backgroundColor: 'skyblue',
          padding: 10,
          borderRadius: 4,
          border: '1px solid black',
          cursor: 'pointer',
        }}
      >
        Hover over me
      </div>
    </Tooltip>
  ),
};

export const ShowByDefault: Story = {
  args: {
    position: TooltipPosition.right,
    defaultShow: true,
  },
  argTypes: {
    position: {
      table: {
        disable: true,
      },
    },
  },

  render: (args) => (
    <Tooltip {...args}>
      <div
        style={{
          backgroundColor: 'skyblue',
          padding: 10,
          borderRadius: 4,
          border: '1px solid black',
          cursor: 'pointer',
        }}
      >
        Hover over me
      </div>
    </Tooltip>
  ),
};

export const FlashFor2Seconds: Story = {
  args: {
    position: TooltipPosition.right,
    flash: true,
    flashDuration: 2000,
  },
  argTypes: {
    position: {
      table: {
        disable: true,
      },
    },
  },

  render: (args) => (
    <Tooltip {...args}>
      <div
        style={{
          backgroundColor: 'skyblue',
          padding: 10,
          borderRadius: 4,
          border: '1px solid black',
          cursor: 'pointer',
        }}
      >
        Hover over me
      </div>
    </Tooltip>
  ),
};

export const ContentWithHTMLElements: Story = {
  args: {
    position: TooltipPosition.right,
    defaultShow: true,
    content: (
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: 5 }}>Hello World</h2>
        <p style={{ marginBottom: 10 }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut metus orci, malesuada sit amet
          massa at, sollicitudin ullamcorper lectus.
        </p>
        <TextInput label="Test" />
      </div>
    ),
  },
  argTypes: {
    position: {
      table: {
        disable: true,
      },
    },
  },

  render: (args) => (
    <Tooltip {...args}>
      <div
        style={{
          backgroundColor: 'skyblue',
          padding: 10,
          borderRadius: 4,
          border: '1px solid black',
          cursor: 'pointer',
        }}
      >
        Hover over me
      </div>
    </Tooltip>
  ),
};
