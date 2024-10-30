import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from '.';
import { Icon, IconName } from '../IconSVG';
import { expect, within } from '@storybook/test';

const meta: Meta<typeof TextInput> = {
  title: 'Components/Text Input',
  component: TextInput,
  parameters: {
    controls: {
      sort: 'requiredFirst',
      expanded: false,
    },
  },
  args: {
    disabled: false,
  },
  argTypes: {
    id: {
      table: {
        disable: true,
      },
    },
    name: {
      table: {
        disable: true,
      },
    },
    label: {
      control: 'text',
      description: 'Label of the text input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text displayed when the input is empty',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state of the text input',
      table: {
        type: {
          summary: 'boolean',
        },
        defaultValue: {
          summary: 'false',
        },
      },
    },
    type: {
      control: 'select',
      options: ['text', 'password', 'number'],
      description: 'Type of the text input',
      table: {
        type: {
          summary: 'string',
        },
        defaultValue: {
          summary: 'text',
        },
        disable: true,
      },
    },
    min: {
      table: {
        disable: true,
      },
    },
    max: {
      table: {
        disable: true,
      },
    },
    maxLength: {
      table: {
        disable: true,
      },
    },
    description: {
      table: {
        disable: true,
      },
    },
    shouldFocus: {
      table: {
        disable: true,
      },
    },
    labelSibling: {
      table: {
        disable: true,
      },
    },
    style: {
      table: {
        disable: true,
      },
    },
    inputStyles: {
      table: {
        disable: true,
      },
    },
    labelStyles: {
      table: {
        disable: true,
      },
    },
    descriptionStyles: {
      table: {
        disable: true,
      },
    },
    onChange: {
      table: {
        disable: true,
      },
    },
    onBlur: {
      table: {
        disable: true,
      },
    },
    onKeyDown: {
      table: {
        disable: true,
      },
    },
    onFocus: {
      table: {
        disable: true,
      },
    },
    labelClassName: {
      table: {
        disable: true,
      },
    },
    inputClassName: {
      table: {
        disable: true,
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
type Story = StoryObj<typeof TextInput>;

export const Default: Story = {
  args: {
    label: 'Name',
    placeholder: 'Enter your name',
  },
  render: (args) => (
    <div style={{ width: 400 }}>
      <TextInput
        {...args}
        labelClassName="dark:text-white"
        inputClassName="dark:border-primary-400 dark:focus:border-white"
      />
    </div>
  ),
};

export const WithDescription: Story = {
  args: {
    label: 'Name',
    placeholder: 'Enter your name',
  },
  render: (args) => (
    <div style={{ width: 400 }}>
      <TextInput
        {...args}
        description={`This is a description placeholder. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
        Praesent efficitur porttitor urna, vel dictum turpis ultrices nec. Sed non enim mattis, aliquet augue eget, consectetur metus.`}
        labelClassName="dark:text-white"
        inputClassName="dark:border-primary-400 dark:focus:border-white"
      />
    </div>
  ),
};

export const WithLabelAddon: Story = {
  args: {
    label: 'Name',
    placeholder: 'Enter your name',
  },
  render: (args) => (
    <div style={{ width: 400 }}>
      <TextInput
        {...args}
        labelSibling={
          <div className="flex items-center gap-2">
            Add anything here. Even an icon!
            <Icon
              name={IconName.Pencil}
              svgClassName="stroke-primary-900 dark:stroke-primary-400"
            />
          </div>
        }
        labelClassName="dark:text-white"
        inputClassName="dark:border-primary-400 dark:focus:border-white"
      />
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    label: 'Name',
    placeholder: 'Enter your name',
  },
  render: (args) => (
    <div style={{ width: 400 }}>
      <TextInput
        {...args}
        labelSibling={
          <div className="relative flex items-center gap-2">
            <Icon
              name={IconName.Alert}
              size={20}
              style={{ position: 'absolute', top: 20, right: 8 }}
              svgClassName="stroke-primary-900 dark:stroke-primary-400"
            />
          </div>
        }
        labelClassName="dark:text-white"
        inputClassName="dark:border-primary-400 dark:focus:border-white"
        inputStyles={{ paddingRight: 30 }}
      />
    </div>
  ),
};

export const NumberInput: Story = {
  args: {
    label: 'Counter',
    type: 'number',
    step: 2,
    min: 0,
    max: 20,
    defaultValue: 0,
  },
  argTypes: {
    label: {
      table: {
        disable: true,
      },
    },
    placeholder: {
      table: {
        disable: true,
      },
    },
    step: {
      table: {
        disable: false,
      },
    },
    min: {
      table: {
        disable: false,
      },
    },
    max: {
      table: {
        disable: false,
      },
    },
  },
  render: (args) => (
    <div style={{ width: 100 }}>
      <TextInput
        {...args}
        labelClassName="dark:text-white"
        inputClassName="dark:border-primary-400 dark:focus:border-white"
      />
    </div>
  ),
};

export const PasswordInput: Story = {
  args: {
    label: 'Secret',
    type: 'password',
    placeholder: 'Enter your secret',
    defaultValue: '12345678910111213',
  },
  render: (args) => (
    <div style={{ width: 400 }}>
      <TextInput
        {...args}
        labelClassName="dark:text-white"
        inputClassName="dark:border-primary-400 dark:focus:border-white"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByLabelText(/secret/i)).toHaveValue('12345678910111213');
  },
};

export const ErrorTextinput: Story = {
  args: {
    label: 'Name',
    placeholder: 'Enter your name',
    value: 'John Doe',
    disabled: false,
    error: 'Name is required',
  },
  argTypes: {
    error: {
      table: {
        disable: false,
      },
    },
  },
  render: (args) => (
    <div style={{ width: 400 }}>
      <TextInput
        {...args}
        labelClassName="dark:text-white"
        inputClassName="dark:border-primary-400 dark:focus:border-white"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByLabelText(/name/i)).toHaveValue('John Doe');
    expect(canvas.getByText(/name is required/i)).toBeInTheDocument();
  },
};
