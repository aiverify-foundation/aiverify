import type { Meta, StoryObj } from '@storybook/react';
import { Button, ButtonVariant } from '.';
import { IconName } from '../IconSVG';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    backgrounds: {
      default: 'transparent',
      values: [{ name: 'black', value: '#000000' }],
    },
    controls: {
      sort: 'requiredFirst',
      expanded: false,
    },
  },
  args: {
    text: 'Your Button',
    size: 'md',
    pill: false,
    bezel: true,
    disabled: false,
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: Object.values(ButtonVariant).filter((variant) => variant !== ButtonVariant.OUTLINE),
    },
    size: {
      control: 'radio',
      options: ['lg', 'md', 'sm', 'xs'],
    },
    pill: {
      control: 'boolean',
    },
    icon: {
      control: 'select',
      options: Object.values(IconName),
    },
    width: {
      control: 'number',
      table: {
        disable: true,
      },
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Bezel: Story = {
  args: {
    variant: ButtonVariant.PRIMARY,
  },
  argTypes: {
    text: {
      description: 'The text of the button',
    },
    variant: {
      options: [ButtonVariant.PRIMARY, ButtonVariant.SECONDARY],
      description: 'There are 5 variants built in.',
      table: {
        type: {
          summary: 'primary | secondary | outline | link | text',
        },
        defaultValue: {
          summary: 'primary',
        },
      },
    },
    size: {
      description: 'The size of the button. There are 4 sizes built in.',
      table: {
        type: {
          summary: 'lg | md | sm | xs',
        },
        defaultValue: {
          summary: 'md',
        },
      },
    },
    pill: {
      description: 'For a pill-shaped button',
      table: {
        defaultValue: {
          summary: 'false',
        },
      },
    },
    bezel: {
      description: 'Whether the button has a bezel or it is just flat',
      table: {
        disable: true,
      },
    },
    color: {
      table: {
        disable: true,
      },
    },
    hoverColor: {
      table: {
        disable: true,
      },
    },
    pressedColor: {
      table: {
        disable: true,
      },
    },
    textColor: {
      table: {
        disable: true,
      },
    },
    icon: {
      table: {
        disable: true,
      },
    },
    iconPosition: {
      table: {
        disable: true,
      },
    },
    iconSize: {
      table: {
        disable: true,
      },
    },
    iconColor: {
      table: {
        disable: true,
      },
    },
  },
};

export const Flat: Story = {
  args: {
    variant: ButtonVariant.PRIMARY,
    bezel: false,
  },
  argTypes: {
    variant: {
      options: [ButtonVariant.PRIMARY, ButtonVariant.SECONDARY, ButtonVariant.OUTLINE],
    },
    color: {
      table: {
        disable: true,
      },
    },
    hoverColor: {
      table: {
        disable: true,
      },
    },
    pressedColor: {
      table: {
        disable: true,
      },
    },
    textColor: {
      table: {
        disable: true,
      },
    },
    icon: {
      table: {
        disable: true,
      },
    },
    iconPosition: {
      table: {
        disable: true,
      },
    },
    iconSize: {
      table: {
        disable: true,
      },
    },
    iconColor: {
      table: {
        disable: true,
      },
    },
  },
};

export const WithIcon: Story = {
  args: {
    variant: ButtonVariant.PRIMARY,
    text: 'With Icon',
    iconPosition: 'left',
    icon: IconName.Close,
    iconSize: 18,
  },
  argTypes: {
    icon: {
      control: 'select',
      options: Object.values(IconName),
    },
    variant: {
      control: 'radio',
      options: Object.values(ButtonVariant),
    },
    color: {
      table: {
        disable: true,
      },
    },
    hoverColor: {
      table: {
        disable: true,
      },
    },
    pressedColor: {
      table: {
        disable: true,
      },
    },
    textColor: {
      table: {
        disable: true,
      },
    },
  },
};

export const Outline: Story = {
  args: {
    variant: ButtonVariant.OUTLINE,
    text: 'Your Button',
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: [ButtonVariant.OUTLINE],
    },
    bezel: {
      table: {
        disable: true,
      },
    },
    icon: {
      table: {
        disable: true,
      },
    },
    iconPosition: {
      table: {
        disable: true,
      },
    },
    iconSize: {
      table: {
        disable: true,
      },
    },
    color: {
      table: {
        disable: true,
      },
    },
    hoverColor: {
      table: {
        disable: true,
      },
    },
    pressedColor: {
      table: {
        disable: true,
      },
    },
    textColor: {
      table: {
        disable: true,
      },
    },
  },
};

export const Link: Story = {
  parameters: {
    backgrounds: {
      default: 'white',
      values: [{ name: 'black', value: '#000000' }],
    },
    controls: {
      sort: 'requiredFirst',
      expanded: false,
    },
  },
  args: {
    variant: ButtonVariant.LINK,
    text: 'This is a link button',
  },
  argTypes: {
    text: {
      description: 'The text of the button',
    },
    variant: {
      description: 'There are 5 variants built in.',
      control: 'radio',
      options: [ButtonVariant.LINK],
      table: {
        type: {
          summary: 'primary | secondary | outline | link | text',
        },
        defaultValue: {
          summary: 'primary',
        },
      },
    },
    size: {
      description: 'The size of the button. There are 4 sizes built in.',
      table: {
        type: {
          summary: 'lg | md | sm | xs',
        },
        defaultValue: {
          summary: 'md',
        },
      },
    },
    pill: {
      description: 'For a pill-shaped button',
      table: {
        defaultValue: {
          summary: 'false',
        },
      },
    },
    bezel: {
      description: 'Whether the button has a bezel or it is just flat',
      table: {
        disable: true,
      },
    },
    color: {
      table: {
        disable: true,
      },
    },
    hoverColor: {
      table: {
        disable: true,
      },
    },
    pressedColor: {
      table: {
        disable: true,
      },
    },
    textColor: {
      table: {
        disable: true,
      },
    },
    icon: {
      table: {
        disable: true,
      },
    },
    iconPosition: {
      table: {
        disable: true,
      },
    },
    iconSize: {
      table: {
        disable: true,
      },
    },
    iconColor: {
      table: {
        disable: true,
      },
    },
  },
};

export const Customized: Story = {
  args: {
    variant: ButtonVariant.PRIMARY,
    text: 'Customized Pill Shaped',
    iconPosition: 'left',
    icon: IconName.Close,
    color: '#524e56',
    hoverColor: '#464349',
    pressedColor: '#3d3a40',
    textColor: '#ffffff',
    pill: true,
    bezel: false,
    width: 280,
    iconSize: 22,
  },
  argTypes: {
    width: {
      control: 'number',
      table: {
        disable: false,
      },
    },
  },
};