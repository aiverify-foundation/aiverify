import { render, screen } from '@testing-library/react';
import ModelListComponent from 'src/modules/assets/modelList';
import { MockedProvider } from '@apollo/client/testing';
import { gql } from '@apollo/client';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mocks = [
  {
    request: {
      query: gql`
        query Query {
          modelFiles {
            id
            name
            filename
            filePath
            ctime
            size
            status
            description
            serializer
            modelFormat
            modelType
            errorMessages
            type
          }
        }
      `,
    },
    result: {
      data: {
        modelFiles: [
          {
            __typename: 'ModelFile',
            id: '6424f3d19dc349ad75842588',
            name: 'tensorflow_tabular_compas_sequential.sav',
            filename: 'tensorflow_tabular_compas_sequential.sav',
            filePath:
              '/home/user/aiverify/uploads/model/tensorflow_tabular_compas_sequential.sav',
            ctime: '2023-03-30T02:28:33.890Z',
            size: null,
            status: 'Valid',
            description: null,
            serializer: 'tensorflow',
            modelFormat: 'tensorflow',
            modelType: 'Classification',
            errorMessages: null,
            type: 'Folder',
          },
          {
            __typename: 'ModelFile',
            id: '642a564af921a817b2192b8c',
            name: 'joblib_scikit_ada_compas.sav',
            filename: 'joblib_scikit_ada_compas.sav',
            filePath:
              '/home/user/aiverify/uploads/model/joblib_scikit_ada_compas.sav',
            ctime: '2023-04-03T04:30:02.414Z',
            size: '561.89 KB',
            status: 'Valid',
            description: '',
            serializer: 'joblib',
            modelFormat: 'sklearn',
            modelType: 'Classification',
            errorMessages: '',
            type: 'File',
          },
        ],
      },
    },
  },
];

describe('Model List', () => {
  it('should render the filters', () => {
    render(
      <MockedProvider mocks={mocks}>
        <ModelListComponent />
      </MockedProvider>
    );
    expect(screen.getByTestId('model-list-filters'));
  });
});
