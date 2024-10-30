import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from '.';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'relative',
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
  ]
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    heading: 'Do you want to remove this items?',
    children: 'Modal',
    primaryBtnLabel: 'Remove',
    secondaryBtnLabel: 'Cancel',
    enableScreenOverlay: true,
    onPrimaryBtnClick: () => null,
    onSecondaryBtnClick: () => null,
    onCloseIconClick: () => null,
  },
  render: (args) => (
    <div className="flex h-screen w-screen justify-center">
      <h1 className="text-black dark:text-white">Modal popup on top of screen overlay</h1>
      <Modal {...args}>
        <ul className="list-disc space-y-2 pl-4 text-primary-100">
          <li>Item number 1</li>
          <li>Item number 2</li>
          <li>Item number 3</li>
        </ul>
      </Modal>
    </div>
  ),
};

export const WithoutSecondaryBtn: Story = {
  args: {
    heading: 'These items have been removed?',
    children: 'Modal',
    primaryBtnLabel: 'Ok',
    enableScreenOverlay: true,
    onPrimaryBtnClick: () => null,
    onCloseIconClick: () => null,
  },
  render: (args) => (
    <div className="flex h-screen w-screen justify-center">
      <h1 className="text-black dark:text-white">Modal popup on top of screen overlay</h1>
      <Modal {...args}>
        <ul className="list-disc space-y-2 pl-4 text-primary-100">
          <li>Item number 1</li>
          <li>Item number 2</li>
        </ul>
      </Modal>
    </div>
  ),
};

export const WithoutActionButtons: Story = {
  args: {
    heading: 'Connection with the server lost',
    children: 'Modal',
    enableScreenOverlay: true,
    height: 'auto',
  },
  render: (args) => (
    <div className="flex h-screen w-screen justify-center">
      <h1 className="text-black dark:text-white">Modal popup on top of screen overlay</h1>
      <Modal {...args} className="h-[150px]">
        <p className="text-primary-100">Please check your internet connection and try again.</p>
      </Modal>
    </div>
  ),
};
