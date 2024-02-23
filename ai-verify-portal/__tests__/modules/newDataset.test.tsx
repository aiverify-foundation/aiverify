import { useRouter } from 'next/router';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewDatasetModule from 'src/modules/assets/newDataset';
import { gql } from '@apollo/client';
import { act } from 'react-dom/test-utils';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { MockProviders } from '__mocks__/mockProviders';
import { silentConsoleLogs } from '__mocks__/mockGlobals';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mocks = [
  {
    request: {
      query: gql`
        subscription validateDatasetUpdated {
          validateDatasetStatusUpdated {
            _id
            dataColumns {
              name
              datatype
              label
            }
            numRows
            numCols
            status
            serializer
            dataFormat
            errorMessages
          }
        }
      `,
    },
    result: {
      data: {
        validateDatasetStatusUpdated: {
          _id: '646da7040da1d597e3ca9b18',
          dataColumns: [
            {
              name: 'age_cat_cat',
              datatype: 'int64',
              label: 'age_cat_cat',
              __typename: 'DatasetColumn',
            },
            {
              name: 'sex_code',
              datatype: 'int64',
              label: 'sex_code',
              __typename: 'DatasetColumn',
            },
            {
              name: 'race_code',
              datatype: 'int64',
              label: 'race_code',
              __typename: 'DatasetColumn',
            },
            {
              name: 'priors_count',
              datatype: 'int64',
              label: 'priors_count',
              __typename: 'DatasetColumn',
            },
            {
              name: 'c_charge_degree_cat',
              datatype: 'int64',
              label: 'c_charge_degree_cat',
              __typename: 'DatasetColumn',
            },
            {
              name: 'two_year_recid',
              datatype: 'int64',
              label: 'two_year_recid',
              __typename: 'DatasetColumn',
            },
          ],
          numRows: 1235,
          numCols: 6,
          status: 'Valid',
          serializer: 'joblib',
          dataFormat: 'pandas',
          errorMessages: '',
          __typename: 'DatasetStatusUpdate',
        },
      },
    },
  },
];

const uploadResponse = [
  {
    filename: 'file1.png',
    name: 'file1.png',
    type: 'File',
    filePath: '../uploads/file1.png',
    ctime: '2023-05-24T05:56:20.830Z',
    description: '',
    status: 'Pending',
    size: '502.71 KB',
    serializer: '',
    dataFormat: '',
    errorMessages: '',
    _id: '646da7040da1d597e3ca9b18',
    dataColumns: [],
  },
];

const file1 = new File(['SomeMockFileContent1'], 'file1.png');
const file2 = new File(['SomeMockFileContent1'], 'file2.png');
const file3 = new File(['SomeMockFileContent1'], 'file3.png');
const file4 = new File(['SomeMockFileContent1'], 'file4.png');
const file5 = new File(['SomeMockFileContent1'], 'file5.png');
const file6 = new File(['SomeMockFileContent1'], 'file6.png');
const file7 = new File(['SomeMockFileContent1'], 'file7.png');
const file8 = new File(['SomeMockFileContent1'], 'file8.png');
const file9 = new File(['SomeMockFileContent1'], 'file9.png');
const file10 = new File(['SomeMockFileContent1'], 'file10.png');
const file11 = new File(['SomeMockFileContent1'], 'file11.png');

describe('New Dataset', () => {
  let amock: any;

  beforeAll(() => {
    amock = new MockAdapter(axios);
    silentConsoleLogs();
  });

  afterEach(() => {
    jest.clearAllMocks();
    amock.reset();
  });

  describe('Initial Render', () => {
    it('should render the back button', () => {
      render(
        <MockProviders apolloMocks={mocks}>
          <NewDatasetModule />
        </MockProviders>
      );
      expect(screen.getByTestId('newdataset-back-button'));
    });

    it('should navigate to dataset list page on button click', () => {
      (useRouter as jest.Mock).mockReturnValue({
        push: jest.fn(),
      });
      const router = useRouter();
      render(
        <MockProviders apolloMocks={mocks}>
          <NewDatasetModule />
        </MockProviders>
      );
      const button = screen.getByTestId('newdataset-back-button');
      act(() => {
        button.click();
      });
      expect(router.push).toHaveBeenCalledWith('/assets/datasets');
    });

    it('should render the upload screen', () => {
      render(
        <MockProviders apolloMocks={mocks}>
          <NewDatasetModule />
        </MockProviders>
      );
      expect(screen.getByText('Add New Datasets')).toBeDefined();
      expect(screen.getByText('Before uploading...')).toBeDefined();
      expect(screen.getByTestId('upload-file-dropbox')).toHaveTextContent(
        'Drag & Drop or Click to Browse'
      );
      expect(screen.getByTestId('upload-folder-button')).toHaveTextContent(
        'Upload Folder'
      );
      expect(screen.getByText('Selected Files')).toBeDefined();
      expect(screen.getByTestId('upload-datasets-button')).toHaveAttribute(
        'aria-disabled',
        'true'
      );
    });
  });

  describe('File Picking', () => {
    it('should enable the upload button when files are picked', async () => {
      const { container } = render(
        <MockProviders apolloMocks={mocks}>
          <NewDatasetModule />
        </MockProviders>
      );
      const button = screen.getByTestId('upload-datasets-button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      const file1 = new File(['hello'], 'file1.png');
      Object.defineProperty(file1, 'webkitRelativePath', { value: '' });
      const input = container.querySelector(`input[name="file-dropbox"]`);
      Object.defineProperty(input, 'files', { value: [file1] });
      act(() => {
        if (input) {
          fireEvent.change(input);
        }
      });
      await Promise.resolve();
      expect(screen.queryByText('file1.png')).toBeTruthy();
      expect(button).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should show error message when more than 10 files are selected', async () => {
      const { container } = render(
        <MockProviders apolloMocks={mocks}>
          <NewDatasetModule />
        </MockProviders>
      );
      const button = screen.getByTestId('upload-datasets-button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      const input = container.querySelector(`input[name="file-dropbox"]`);
      Object.defineProperty(input, 'files', {
        value: [
          file1,
          file2,
          file3,
          file4,
          file5,
          file6,
          file7,
          file8,
          file9,
          file10,
          file11,
        ],
      });
      act(() => {
        if (input) {
          fireEvent.change(input);
        }
      });
      await Promise.resolve();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(screen.queryByText('file1.png')).toBeNull();
      expect(screen.getByText('File selection error')).toBeDefined();
      expect(
        screen.getByText(
          'Maximum 10 files to be uploaded at once. Please select less files.'
        )
      ).toBeDefined();
    });

    it('should show error message when more than 10 files in total are selected', async () => {
      const { container } = render(
        <MockProviders apolloMocks={mocks}>
          <NewDatasetModule />
        </MockProviders>
      );
      const button = screen.getByTestId('upload-datasets-button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      const input = container.querySelector(`input[name="file-dropbox"]`);
      Object.defineProperty(input, 'files', {
        value: [file1, file2, file3, file4, file5, file6, file7, file8, file9],
        writable: true,
      });
      act(() => {
        if (input) {
          fireEvent.change(input);
        }
      });
      await Promise.resolve();
      expect(button).not.toHaveAttribute('aria-disabled', 'true');
      const input2 = container.querySelector(`input[name="file-dropbox"]`);
      Object.defineProperty(input2, 'files', {
        value: [file10, file11],
      });
      act(() => {
        if (input2) {
          fireEvent.change(input2);
        }
      });
      expect(button).not.toHaveAttribute('aria-disabled', 'true');
      act(() => {
        button.click();
      });
      expect(screen.getByText('File selection error')).toBeDefined();
      expect(
        screen.getByText(
          'Maximum 10 files to be uploaded at once. Please select less files.'
        )
      ).toBeDefined();
    });

    it('should show error message if any file selected is more than 4GB', async () => {
      const { container } = render(
        <MockProviders apolloMocks={mocks}>
          <NewDatasetModule />
        </MockProviders>
      );
      const button = screen.getByTestId('upload-datasets-button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      const file = new File([''], 'file.png');
      Object.defineProperty(file, 'size', { value: 4000000001 });
      const input = container.querySelector(`input[name="file-dropbox"]`);
      Object.defineProperty(input, 'files', {
        value: [file1, file, file3],
      });
      act(() => {
        if (input) {
          fireEvent.change(input);
        }
      });
      await Promise.resolve();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(screen.queryByText('file.png')).toBeNull();
      expect(screen.getByText('File selection error')).toBeDefined();
      expect(
        screen.getByText(
          'Maximum file size is 4GB. Please upload smaller files.'
        )
      ).toBeDefined();
    });

    it('should unpick file', async () => {
      const { container } = render(
        <MockProviders apolloMocks={mocks}>
          <NewDatasetModule />
        </MockProviders>
      );
      Object.defineProperty(file1, 'webkitRelativePath', { value: '' });
      const input = container.querySelector(`input[name="file-dropbox"]`);
      Object.defineProperty(input, 'files', { value: [file1] });
      act(() => {
        if (input) {
          fireEvent.change(input);
        }
      });
      await Promise.resolve();
      expect(screen.queryByText('file1.png')).toBeTruthy();
      act(() => {
        screen.getByTestId('unpick-file').click();
      });
      expect(screen.queryByText('file1.png')).toBeNull();
    });

    it('should display cancel button when files are being uploaded', async () => {
      const { container } = render(
        <MockProviders apolloMocks={mocks}>
          <NewDatasetModule />
        </MockProviders>
      );
      const button = screen.getByTestId('upload-datasets-button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      Object.defineProperty(file1, 'webkitRelativePath', { value: '' });
      const input = container.querySelector(`input[name="file-dropbox"]`);
      Object.defineProperty(input, 'files', { value: [file1] });
      act(() => {
        if (input) {
          fireEvent.change(input);
        }
      });
      await Promise.resolve();
      expect(screen.queryByText('file1.png')).toBeTruthy();
      expect(button).not.toHaveAttribute('aria-disabled', 'true');
      const uploads = [{ data: [file1] }];
      act(() => {
        amock.onPost(`/api/upload/data`).reply(200, uploads);
        button.click();
      });
      let cancelButton: any;
      await waitFor(() => {
        cancelButton = screen.getByTestId('cancel-button');
        expect(cancelButton).toBeDefined();
      });
    });
  });

  describe('File Validation', () => {
    it('should load validation components upon successful upload', async () => {
      const { container } = render(
        <MockProviders apolloMocks={mocks}>
          <NewDatasetModule />
        </MockProviders>
      );
      const button = screen.getByTestId('upload-datasets-button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      Object.defineProperty(file1, 'webkitRelativePath', { value: '' });
      const input = container.querySelector(`input[name="file-dropbox"]`);
      Object.defineProperty(input, 'files', { value: [file1] });
      act(() => {
        if (input) {
          fireEvent.change(input);
        }
      });
      await Promise.resolve();
      expect(screen.queryByText('file1.png')).toBeTruthy();
      expect(button).not.toHaveAttribute('aria-disabled', 'true');
      act(() => {
        amock.onPost(`/api/upload/data`).reply(201, uploadResponse);
        button.click();
      });
      await waitFor(() => {
        expect(screen.queryByText('Validating Uploads...')).toBeTruthy();
        expect(screen.queryAllByText('file1.png').length).toBe(2);
        expect(screen.queryByText('Status:')).toBeTruthy();
        expect(screen.queryByText('Date Uploaded:')).toBeTruthy();
        expect(screen.queryByText('Size:')).toBeTruthy();
        expect(screen.getByTestId('cancel-validation-button')).toBeDefined();
      });
    });
  });
});
