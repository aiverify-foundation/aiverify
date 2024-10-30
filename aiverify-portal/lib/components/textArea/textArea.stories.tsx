import type { Meta, StoryObj } from '@storybook/react';
import { TextArea } from '.';

const meta: Meta<typeof TextArea> = {
  title: 'Components/Text Area',
  component: TextArea,
  parameters: {
    controls: {
      sort: 'requiredFirst',
      expanded: false,
    },
  },
  args: {
    disabled: false,
    resizeEnabled: false,
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
      description: 'Label of the textarea',
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
    resizeEnabled: {
      control: 'boolean',
      description: 'Enable resize of the text area',
      table: {
        type: {
          summary: 'boolean',
        },
        defaultValue: {
          summary: 'false',
        },
      },
    },
    containerStyles: {
      table: {
        disable: true,
      },
    },
    maxLength: {
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
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {
  args: {
    label: 'Address',
    placeholder: 'Enter your address',
  },
  render: (args) => (
    <div style={{ width: 400 }}>
      <TextArea
        {...args}
        labelClassName="dark:text-white"
        inputClassName="dark:border-primary-400 dark:focus:border-white"
      />
    </div>
  ),
};

export const ErrorTextarea: Story = {
  args: {
    label: 'Address',
    placeholder: 'Enter your address',
    error: 'Address is required',
  },
  render: (args) => (
    <div style={{ width: 400 }}>
      <TextArea {...args} />
    </div>
  ),
};
