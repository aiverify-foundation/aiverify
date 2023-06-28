import { useRouter } from 'next/router';
import { render, screen } from '@testing-library/react';
import NewModelUploadModule from 'src/modules/assets/newModelUpload';
import { gql } from '@apollo/client';
import { MockProviders } from '__mocks__/mockProviders';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mocks = [
  {
    request: {
      query: gql`
        subscription validateModelUpdated {
          validateModelStatusUpdated {
            _id
            status
            serializer
            modelFormat
            errorMessages
          }
        }
      `,
    },
    result: {
      data: {
        validateModelStatusUpdated: {
          _id: '642a564af921a817b2192b8c',
          status: 'Valid',
          serializer: 'joblib',
          modelFormat: 'sklearn',
          errorMessages: '',
          __typename: 'Status',
        },
      },
    },
  },
];

describe('New Model Upload', () => {
  it('should render the back button', () => {
    render(
      <MockProviders apolloMocks={mocks}>
        <NewModelUploadModule />
      </MockProviders>
    );
    expect(screen.getByTestId('newmodelupload-back-button'));
  });

  it('should navigate to new model page on button click', () => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    const router = useRouter();
    render(
      <MockProviders apolloMocks={mocks}>
        <NewModelUploadModule />
      </MockProviders>
    );
    const button = screen.getByTestId('newmodelupload-back-button');
    button.click();
    expect(router.push).toHaveBeenCalledWith('/assets/newModel');
  });

  it('should render the upload screen', () => {
    render(
      <MockProviders apolloMocks={mocks}>
        <NewModelUploadModule />
      </MockProviders>
    );
    expect(
      screen.getByText('Add New AI Model > Upload Model File')
    ).toBeDefined();
    expect(screen.getByText('Before uploading...')).toBeDefined();
    expect(screen.getByTestId('upload-file-dropbox')).toHaveTextContent(
      'Drag & Drop or Click to Browse'
    );
    expect(screen.getByTestId('upload-folder-button')).toHaveTextContent(
      'Upload Folder'
    );
    expect(screen.getByText('Selected Files')).toBeDefined();
    expect(screen.getByTestId('upload-models-button')).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });
});
