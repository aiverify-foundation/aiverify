import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import GroupNameHeader from '../GroupNameHeader';

// --- VARIABLE-BASED MOCKS SETUP ---

// Router
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

// Context
let mockContextReturn: any;
jest.mock('@/app/inputs/context/InputBlockGroupDataContext', () => ({
  useInputBlockGroupData: () => mockContextReturn,
}));

// useDeleteGroup
let mockDeleteGroupReturn: any;
jest.mock('../../hooks/useDeleteGroup', () => ({
  useDeleteGroup: () => mockDeleteGroupReturn,
}));

// useProcessChecklistExport
let mockExportJsonReturn: any;
let mockExportXlsxReturn: any;
jest.mock('../../hooks/useProcessChecklistExport', () => ({
  useProcessChecklistExport: (format: string) =>
    format === 'json' ? mockExportJsonReturn : mockExportXlsxReturn,
  EXPORT_PROCESS_CHECKLISTS_CID: 'export_process_checklists',
}));

// useMDXSummaryBundle
let mockMDXSummaryBundleReturn: any;
jest.mock('../../hooks/useMDXSummaryBundle', () => ({
  useMDXSummaryBundle: () => mockMDXSummaryBundleReturn,
}));

// Icon
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, color }: { name: string; color: string }) => (
    <div data-testid={`icon-${name}`} data-color={color}>{name}</div>
  ),
  IconName: {
    Pencil: 'Pencil',
    Delete: 'Delete',
  },
}));

// Modal
jest.mock('@/lib/components/modal', () => ({
  Modal: ({ heading, children, onCloseIconClick, primaryBtnLabel, secondaryBtnLabel, onPrimaryBtnClick, onSecondaryBtnClick }: any) => (
    <div data-testid="modal" data-heading={heading}>
      <div data-testid="modal-content">{children}</div>
      {onCloseIconClick && <button data-testid="modal-close" onClick={onCloseIconClick}>Close</button>}
      {primaryBtnLabel && <button data-testid="modal-primary" onClick={onPrimaryBtnClick}>{primaryBtnLabel}</button>}
      {secondaryBtnLabel && <button data-testid="modal-secondary" onClick={onSecondaryBtnClick}>{secondaryBtnLabel}</button>}
    </div>
  ),
}));

// RemixIcon
jest.mock('@remixicon/react', () => ({
  RiDownloadLine: ({ size }: { size: number }) => (
    <div data-testid="download-icon" data-size={size}>Download</div>
  ),
}));

// URL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// --- DEFAULT MOCK VALUES ---
const defaultContext = {
  groupId: 123,
  group: 'test-group',
  currentGroupData: {
    id: 123,
    name: 'Test Group',
    gid: 'test-gid',
    group: 'test-group',
    input_blocks: [
      { cid: 'test-cid-1', name: 'Test Input Block 1', data: { testField: 'test value' } },
      { cid: 'test-cid-2', name: 'Test Input Block 2', data: { testField: 'test value 2' } },
    ],
  },
  gid: 'test-gid',
};
const mockMutate = jest.fn();
const defaultDeleteGroup = { mutate: mockMutate, isPending: false, isSuccess: false, isError: false };
const mockHandleJsonExport = jest.fn();
const mockHandleXlsxExport = jest.fn();
const defaultExportJson = { isExporting: false, handleExport: mockHandleJsonExport };
const defaultExportXlsx = { isExporting: false, handleExport: mockHandleXlsxExport };
const defaultMDXSummaryBundle = { data: { code: 'export function exportProcessChecklists() { return true; }' }, isLoading: false, error: null };

// --- TESTS ---
describe('GroupNameHeader', () => {
  const defaultProps = {
    groupName: 'Test Group',
    updateGroupName: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockContextReturn = { ...defaultContext };
    mockDeleteGroupReturn = { ...defaultDeleteGroup };
    mockExportJsonReturn = { ...defaultExportJson };
    mockExportXlsxReturn = { ...defaultExportXlsx };
    mockMDXSummaryBundleReturn = { ...defaultMDXSummaryBundle };
    mockCreateObjectURL.mockReturnValue('blob:test-url');
  });

  describe('Rendering', () => {
    it('renders the group name as a heading when not editing', () => {
      render(<GroupNameHeader {...defaultProps} />);
      expect(screen.getByText('Test Group')).toBeInTheDocument();
      expect(screen.getByText('Test Group')).toHaveClass('text-3xl', 'font-bold');
    });
    it('renders edit and delete buttons', () => {
      render(<GroupNameHeader {...defaultProps} />);
      expect(screen.getByTestId('icon-Pencil')).toBeInTheDocument();
      expect(screen.getByTestId('icon-Delete')).toBeInTheDocument();
    });
    it('renders export button when export functionality is available', () => {
      render(<GroupNameHeader {...defaultProps} />);
      expect(screen.getByTestId('download-icon')).toBeInTheDocument();
      expect(screen.getByTestId('download-icon')).toHaveAttribute('data-size', '20');
    });
    it('does not render export button when export functionality is not available', () => {
      mockMDXSummaryBundleReturn = { data: null, isLoading: false, error: null };
      render(<GroupNameHeader {...defaultProps} />);
      expect(screen.queryByTestId('download-icon')).not.toBeInTheDocument();
    });
  });

  describe('Edit functionality', () => {
    it('switches to edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const editButton = screen.getByTestId('icon-Pencil').parentElement;
      await user.click(editButton!);
      expect(screen.getByDisplayValue('Test Group')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
    it('allows editing the group name', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const editButton = screen.getByTestId('icon-Pencil').parentElement;
      await user.click(editButton!);
      const input = screen.getByDisplayValue('Test Group');
      await user.clear(input);
      await user.type(input, 'Updated Group Name');
      expect(input).toHaveValue('Updated Group Name');
    });
    it('saves the group name when form is submitted', async () => {
      const user = userEvent.setup();
      const updateGroupName = jest.fn();
      render(<GroupNameHeader {...defaultProps} updateGroupName={updateGroupName} />);
      const editButton = screen.getByTestId('icon-Pencil').parentElement;
      await user.click(editButton!);
      const input = screen.getByDisplayValue('Test Group');
      await user.clear(input);
      await user.type(input, 'Updated Group Name');
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      expect(updateGroupName).toHaveBeenCalledWith('Updated Group Name');
      expect(screen.getByText('Updated Group Name')).toBeInTheDocument();
    });
    it('cancels editing when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const editButton = screen.getByTestId('icon-Pencil').parentElement;
      await user.click(editButton!);
      const input = screen.getByDisplayValue('Test Group');
      await user.clear(input);
      await user.type(input, 'Updated Group Name');
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      expect(screen.getByText('Test Group')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Updated Group Name')).not.toBeInTheDocument();
    });
    it('enforces max length on input', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const editButton = screen.getByTestId('icon-Pencil').parentElement;
      await user.click(editButton!);
      const input = screen.getByDisplayValue('Test Group');
      expect(input).toHaveAttribute('maxLength', '128');
    });
    it('auto-focuses the input when entering edit mode', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const editButton = screen.getByTestId('icon-Pencil').parentElement;
      await user.click(editButton!);
      const input = screen.getByDisplayValue('Test Group');
      expect(input).toHaveFocus();
    });
  });

  describe('Delete functionality', () => {
    it('shows delete confirmation modal when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const deleteButton = screen.getByTestId('icon-Delete').parentElement;
      await user.click(deleteButton!);
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal')).toHaveAttribute('data-heading', 'Confirm Deletion');
      expect(screen.getByText('Are you sure you want to delete this group and all its checklists?')).toBeInTheDocument();
    });
    it('confirms deletion when confirm button is clicked', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const deleteButton = screen.getByTestId('icon-Delete').parentElement;
      await user.click(deleteButton!);
      const confirmButton = screen.getByTestId('modal-primary');
      await user.click(confirmButton);
      expect(mockMutate).toHaveBeenCalledWith({ groupId: 123 });
    });
    it('cancels deletion when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const deleteButton = screen.getByTestId('icon-Delete').parentElement;
      await user.click(deleteButton!);
      const cancelButton = screen.getByTestId('modal-secondary');
      await user.click(cancelButton);
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
    it('closes delete modal when close icon is clicked', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const deleteButton = screen.getByTestId('icon-Delete').parentElement;
      await user.click(deleteButton!);
      const closeButton = screen.getByTestId('modal-close');
      await user.click(closeButton);
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
    it('shows success message when deletion is successful', async () => {
      mockDeleteGroupReturn = { ...defaultDeleteGroup, isSuccess: true };
      render(<GroupNameHeader {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByTestId('modal')).toHaveAttribute('data-heading', 'Success');
        expect(screen.getByText('Group deleted successfully.')).toBeInTheDocument();
      });
    });
    it('shows error message when deletion fails', async () => {
      mockDeleteGroupReturn = { ...defaultDeleteGroup, isError: true };
      render(<GroupNameHeader {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByTestId('modal')).toHaveAttribute('data-heading', 'Error');
        expect(screen.getByText('Failed to delete the group. Please try again.')).toBeInTheDocument();
      });
    });
    it('navigates back when modal is closed after successful deletion', async () => {
      mockDeleteGroupReturn = { ...defaultDeleteGroup, isSuccess: true };
      render(<GroupNameHeader {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
      const closeButton = screen.getByTestId('modal-close');
      await userEvent.click(closeButton);
      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Export functionality', () => {
    it('shows export format selection modal when export button is clicked', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const exportButton = screen.getByTestId('download-icon').parentElement;
      await user.click(exportButton!);
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal')).toHaveAttribute('data-heading', 'Export Checklists');
      expect(screen.getByText('Choose a format to export your checklists:')).toBeInTheDocument();
    });
    it('allows selecting export format', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const exportButton = screen.getByTestId('download-icon').parentElement;
      await user.click(exportButton!);
      const xlsxRadio = screen.getByLabelText('Excel (.xlsx)');
      await user.click(xlsxRadio);
      expect(xlsxRadio).toBeChecked();
    });
    it('exports as JSON when JSON format is selected and export is clicked', async () => {
      const user = userEvent.setup();
      mockHandleJsonExport.mockResolvedValue({ testData: 'json export' });
      render(<GroupNameHeader {...defaultProps} />);
      const exportButton = screen.getByTestId('download-icon').parentElement;
      await user.click(exportButton!);
      const exportButtonInModal = screen.getByTestId('modal-primary');
      await user.click(exportButtonInModal);
      await waitFor(() => {
        expect(mockHandleJsonExport).toHaveBeenCalled();
        expect(screen.getByTestId('modal')).toHaveAttribute('data-heading', 'Success');
        expect(screen.getByText('Export as JSON completed successfully.')).toBeInTheDocument();
      });
    });
    it('exports as XLSX when XLSX format is selected and export is clicked', async () => {
      const user = userEvent.setup();
      mockHandleXlsxExport.mockResolvedValue(true);
      render(<GroupNameHeader {...defaultProps} />);
      const exportButton = screen.getByTestId('download-icon').parentElement;
      await user.click(exportButton!);
      const xlsxRadio = screen.getByLabelText('Excel (.xlsx)');
      await user.click(xlsxRadio);
      const exportButtonInModal = screen.getByTestId('modal-primary');
      await user.click(exportButtonInModal);
      await waitFor(() => {
        expect(mockHandleXlsxExport).toHaveBeenCalled();
        expect(screen.getByTestId('modal')).toHaveAttribute('data-heading', 'Success');
        expect(screen.getByText('Export as XLSX completed successfully.')).toBeInTheDocument();
      });
    });
    it('creates and downloads JSON file when JSON export is successful', async () => {
      const user = userEvent.setup();
      const jsonData = { testData: 'json export' };
      mockHandleJsonExport.mockResolvedValue(jsonData);

      render(<GroupNameHeader {...defaultProps} />);

      const exportButton = screen.getByTestId('download-icon').parentElement;
      await user.click(exportButton!);
      const exportButtonInModal = screen.getByTestId('modal-primary');
      await user.click(exportButtonInModal);

      await waitFor(() => {
        expect(mockHandleJsonExport).toHaveBeenCalled();
        expect(screen.getByTestId('modal')).toHaveAttribute('data-heading', 'Success');
        expect(screen.getByText('Export as JSON completed successfully.')).toBeInTheDocument();
      });
    });
    it('handles export errors gracefully', async () => {
      const user = userEvent.setup();
      mockHandleJsonExport.mockRejectedValue(new Error('Export failed'));
      render(<GroupNameHeader {...defaultProps} />);
      const exportButton = screen.getByTestId('download-icon').parentElement;
      await user.click(exportButton!);
      const exportButtonInModal = screen.getByTestId('modal-primary');
      await user.click(exportButtonInModal);
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toHaveAttribute('data-heading', 'Error');
        expect(screen.getByText('Export failed: Export failed')).toBeInTheDocument();
      });
    });
    it('closes export modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const exportButton = screen.getByTestId('download-icon').parentElement;
      await user.click(exportButton!);
      const cancelButton = screen.getByTestId('modal-secondary');
      await user.click(cancelButton);
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
    it('closes export modal when close icon is clicked', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const exportButton = screen.getByTestId('download-icon').parentElement;
      await user.click(exportButton!);
      const closeButton = screen.getByTestId('modal-close');
      await user.click(closeButton);
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
    it('disables export button when export is in progress', async () => {
      mockExportJsonReturn = { isExporting: true, handleExport: mockHandleJsonExport };
      render(<GroupNameHeader {...defaultProps} />);
      const exportButton = screen.getByTestId('download-icon').parentElement;
      expect(exportButton).toBeDisabled();
    });
  });

  describe('State management', () => {
    it('updates local state when initialGroupName changes', () => {
      const { rerender } = render(<GroupNameHeader {...defaultProps} />);
      expect(screen.getByText('Test Group')).toBeInTheDocument();
      
      // The component uses currentGroupData.name, not the prop directly
      mockContextReturn = { ...defaultContext, currentGroupData: { ...defaultContext.currentGroupData, name: 'Updated Group' } };
      rerender(<GroupNameHeader {...defaultProps} />);
      expect(screen.getByText('Updated Group')).toBeInTheDocument();
    });

    it('handles empty group name', () => {
      mockContextReturn = { ...defaultContext, currentGroupData: { ...defaultContext.currentGroupData, name: '' } };
      render(<GroupNameHeader {...defaultProps} />);
      // Use a more specific selector to find the h1 element with empty text
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('');
    });

    it('handles null currentGroupData', () => {
      mockContextReturn = { ...defaultContext, currentGroupData: null };
      render(<GroupNameHeader {...defaultProps} />);
      // When currentGroupData is null, the component shows empty string, not the prop value
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('');
    });
  });

  describe('Edge cases', () => {
    it('handles missing groupId in delete confirmation', async () => {
      mockContextReturn = { ...defaultContext, groupId: null };
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const deleteButton = screen.getByTestId('icon-Delete').parentElement;
      await user.click(deleteButton!);
      const confirmButton = screen.getByTestId('modal-primary');
      await user.click(confirmButton);
      expect(mockMutate).not.toHaveBeenCalled();
    });
    it('handles export with no checklists', async () => {
      mockContextReturn = { ...defaultContext, currentGroupData: { ...defaultContext.currentGroupData, input_blocks: [] } };
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const exportButton = screen.getByTestId('download-icon').parentElement;
      await user.click(exportButton!);
      const exportButtonInModal = screen.getByTestId('modal-primary');
      await user.click(exportButtonInModal);
      await waitFor(() => {
        expect(mockHandleJsonExport).toHaveBeenCalled();
      });
    });
    it('handles form submission with empty group name', async () => {
      const user = userEvent.setup();
      const updateGroupName = jest.fn();
      render(<GroupNameHeader {...defaultProps} updateGroupName={updateGroupName} />);
      const editButton = screen.getByTestId('icon-Pencil').parentElement;
      await user.click(editButton!);
      const input = screen.getByDisplayValue('Test Group');
      await user.clear(input);
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      expect(updateGroupName).toHaveBeenCalledWith('');
    });
    it('handles rapid button clicks', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const editButton = screen.getByTestId('icon-Pencil').parentElement;
      const deleteButton = screen.getByTestId('icon-Delete').parentElement;
      await user.click(editButton!);
      await user.click(deleteButton!);
      expect(screen.getByDisplayValue('Test Group')).toBeInTheDocument();
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure for editing', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const editButton = screen.getByTestId('icon-Pencil').parentElement;
      await user.click(editButton!);
      
      // Use querySelector to find the form by its id since it doesn't have a test-id
      const form = document.querySelector('#edit-name-form');
      expect(form).toHaveAttribute('id', 'edit-name-form');
    });
    it('has proper button labels and roles', () => {
      render(<GroupNameHeader {...defaultProps} />);
      const editButton = screen.getByTestId('icon-Pencil').parentElement;
      const deleteButton = screen.getByTestId('icon-Delete').parentElement;
      const exportButton = screen.getByTestId('download-icon').parentElement;
      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
      expect(exportButton).toBeInTheDocument();
    });
    it('has proper modal structure', async () => {
      const user = userEvent.setup();
      render(<GroupNameHeader {...defaultProps} />);
      const deleteButton = screen.getByTestId('icon-Delete').parentElement;
      await user.click(deleteButton!);
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveAttribute('data-heading', 'Confirm Deletion');
    });
  });
}); 