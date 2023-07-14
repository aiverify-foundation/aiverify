import { useRouter } from 'next/router';
import { render, screen } from '@testing-library/react';
import NewPipelineUploadModule from 'src/modules/assets/newPipelineUpload';
import { gql } from '@apollo/client';
import { MockProviders } from '__mocks__/mockProviders';
import { silentConsoleLogs } from '__mocks__/mockGlobals';

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

describe('New Pipeline Upload', () => {
  beforeAll(() => {
    silentConsoleLogs();
  });

  it('should render the back button', () => {
    render(
      <MockProviders apolloMocks={mocks}>
        <NewPipelineUploadModule />
      </MockProviders>
    );
    expect(screen.getByTestId('newpipelineupload-back-button'));
  });

  it('should navigate to new model page on button click', () => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    const router = useRouter();
    render(
      <MockProviders apolloMocks={mocks}>
        <NewPipelineUploadModule />
      </MockProviders>
    );
    const button = screen.getByTestId('newpipelineupload-back-button');
    button.click();
    expect(router.push).toHaveBeenCalledWith('/assets/newModel');
  });

  it('should render the upload screen', () => {
    render(
      <MockProviders apolloMocks={mocks}>
        <NewPipelineUploadModule />
      </MockProviders>
    );
    expect(
      screen.getByText('Add New AI Model > Upload Pipeline File')
    ).toBeDefined();
    expect(screen.getByText('Before uploading...')).toBeDefined();
    expect(screen.getByTestId('upload-file-dropbox')).toHaveTextContent(
      'Drag & Drop or Click to Browse'
    );
    expect(screen.getByText('Selected Folders')).toBeDefined();
    expect(screen.getByTestId('upload-models-button')).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });
});
