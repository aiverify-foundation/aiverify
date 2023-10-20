import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockProviders } from '__mocks__/mockProviders';
import { silentConsoleLogs } from '__mocks__/mockGlobals';
import { NewModelApiConfigModule } from 'src/modules/assets/modelAPIComponent';
import { GQL_CREATE_MODELAPI } from 'src/modules/assets/modelAPIComponent/gql';
import {
  saveConfigVariables_result,
  saveConfigVariables_tc000,
  saveConfigVariables_tc001,
  saveConfigVariables_tc002,
  saveConfigVariables_tc003,
  saveConfigVariables_tc004,
  saveConfigVariables_tc005,
  saveConfigVariables_tc006,
  saveConfigVariables_tc007,
  saveConfigVariables_tc008,
  saveConfigVariables_tc009,
  saveConfigVariables_tc013,
  saveConfigVariables_tc014,
  saveConfigVariables_tc015,
} from '__mocks__/mockNewApiModelGqlVars';
import { MediaType } from 'src/modules/assets/modelAPIComponent/types';

const testTimeout = 20000;

describe('New Model API Config', () => {
  beforeAll(() => {
    silentConsoleLogs();
  });

  describe('Initial Render', () => {
    it('should render with the correct defaults', async () => {
      const { container } = render(
        <MockProviders>
          <NewModelApiConfigModule />
        </MockProviders>
      );

      expect(
        await screen.findByText(/^Create API Configuration$/i)
      ).toBeInTheDocument();
      const selectedTabBtn = container.querySelector(
        '.tabBtn__selected'
      ) as Element;
      expect(selectedTabBtn.textContent).toBe('Request Body');
      expect(container).toMatchSnapshot('New Model API Config Default');
    });
  });

  describe('GraphQL Model API Config Payloads (Happy Flow)', () => {
    it(
      'should create the correct payload with No Auth (tc000)',
      async () => {
        const mocks_tc000 = [
          {
            request: {
              query: GQL_CREATE_MODELAPI,
              variables: { model: saveConfigVariables_tc000 },
            },
            result: {
              data: saveConfigVariables_result,
            },
          },
        ];

        const { container } = render(
          <MockProviders apolloMocks={mocks_tc000}>
            <div id="aivModal"></div>
            <NewModelApiConfigModule />
          </MockProviders>
        );

        await screen.findByText(/^Create API Configuration$/i);
        const editNameBtn = await screen.findByTestId('editConfigIconBtn');
        const addPropertyBtn = await screen.findByTestId(
          'addRequestPropertyBtn'
        );
        const saveBtn = await screen.findByText(/^SAVE$/i);
        userEvent.click(editNameBtn);
        await screen.findByText(/^OK$/i);
        await userEvent.type(
          container.querySelector('input[name="name"]') as HTMLInputElement,
          'My test API'
        );
        await userEvent.type(
          container.querySelector(
            'textarea[name="description"]'
          ) as HTMLTextAreaElement,
          'My test API description'
        );
        const modelTypeInputContainer = container.querySelector(
          'label[for="modelType"]'
        ) as HTMLElement;
        userEvent.click(
          modelTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            modelTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Regression'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.url"]'
          ) as HTMLInputElement,
          'https://localhost:5000/predict/tc001'
        );
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'age'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'gender'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'race'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'income'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment_length'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'total_donated'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'num_donation'
        );
        await userEvent.click(addPropertyBtn);
        await waitFor(async () => {
          expect(
            Array.from(container.querySelectorAll('.propertyInputRow')).length
          ).toEqual(9);
        });

        userEvent.click(saveBtn);
        expect(
          await screen.findByText(/^New API Configuration created$/i)
        ).toBeInTheDocument();
        expect(
          await screen.findByText(/^64d5a78656d3605a78346770$/i)
        ).toBeInTheDocument();
      },
      testTimeout
    );

    it(
      'should create the correct payload with Bearer Token Auth (tc001)',
      async () => {
        const mocks_tc001 = [
          {
            request: {
              query: GQL_CREATE_MODELAPI,
              variables: { model: saveConfigVariables_tc001 },
            },
            result: {
              data: saveConfigVariables_result,
            },
          },
        ];

        const { container } = render(
          <MockProviders apolloMocks={mocks_tc001}>
            <div id="aivModal"></div>
            <NewModelApiConfigModule />
          </MockProviders>
        );

        await screen.findByText(/^Create API Configuration$/i);
        const editNameBtn = await screen.findByTestId('editConfigIconBtn');
        const addPropertyBtn = await screen.findByTestId(
          'addRequestPropertyBtn'
        );
        const saveBtn = await screen.findByText(/^SAVE$/i);
        userEvent.click(editNameBtn);
        await screen.findByText(/^OK$/i);
        await userEvent.type(
          container.querySelector('input[name="name"]') as HTMLInputElement,
          'My test API'
        );
        await userEvent.type(
          container.querySelector(
            'textarea[name="description"]'
          ) as HTMLTextAreaElement,
          'My test API description'
        );
        const modelTypeInputContainer = container.querySelector(
          'label[for="modelType"]'
        ) as HTMLElement;
        userEvent.click(
          modelTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            modelTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Regression'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.url"]'
          ) as HTMLInputElement,
          'https://localhost:5000/predict/tc001'
        );
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'age'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'gender'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'race'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'income'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment_length'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'total_donated'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'num_donation'
        );
        await userEvent.click(addPropertyBtn);
        await waitFor(async () => {
          expect(
            Array.from(container.querySelectorAll('.propertyInputRow')).length
          ).toEqual(9);
        });

        userEvent.click(await screen.findByText(/^Authentication Settings$/i));
        await screen.findByText(/^Authentication Type$/i);
        const authTypeInputContainer = container.querySelector(
          'label[for="modelAPI.authType"]'
        ) as HTMLElement;
        userEvent.click(
          authTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            authTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Bearer Token'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await screen.findByText(/^Token$/i);
        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.authTypeConfig.token"]'
          ) as HTMLInputElement,
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMmY4MTJiNmJlM2IzMjEyMTQzMjBjZiIsImlhdCI6MTY2MDE5Nzg3MCwiZXhwIjoxNjYyNzg5ODcwfQ.cebsoHVMzV4GGwX-QjHFc5CcTkEy7jLQQLaaHlvN2JU'
        );

        userEvent.click(saveBtn);
        expect(
          await screen.findByText(/^New API Configuration created$/i)
        ).toBeInTheDocument();
        expect(
          await screen.findByText(/^64d5a78656d3605a78346770$/i)
        ).toBeInTheDocument();
      },
      testTimeout
    );

    it(
      'should create the correct payload with Basic Auth (tc002)',
      async () => {
        const mocks_tc002 = [
          {
            request: {
              query: GQL_CREATE_MODELAPI,
              variables: { model: saveConfigVariables_tc002 },
            },
            result: {
              data: saveConfigVariables_result,
            },
          },
        ];

        const { container } = render(
          <MockProviders apolloMocks={mocks_tc002}>
            <div id="aivModal"></div>
            <NewModelApiConfigModule />
          </MockProviders>
        );

        await screen.findByText(/^Create API Configuration$/i);
        const editNameBtn = await screen.findByTestId('editConfigIconBtn');
        const addPropertyBtn = await screen.findByTestId(
          'addRequestPropertyBtn'
        );
        const saveBtn = await screen.findByText(/^SAVE$/i);
        userEvent.click(editNameBtn);
        await screen.findByText(/^OK$/i);
        await userEvent.type(
          container.querySelector('input[name="name"]') as HTMLInputElement,
          'My test API'
        );
        await userEvent.type(
          container.querySelector(
            'textarea[name="description"]'
          ) as HTMLTextAreaElement,
          'My test API description'
        );
        const modelTypeInputContainer = container.querySelector(
          'label[for="modelType"]'
        ) as HTMLElement;
        userEvent.click(
          modelTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            modelTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Regression'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.url"]'
          ) as HTMLInputElement,
          'https://localhost:5000/predict/tc001'
        );
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'age'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'gender'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'race'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'income'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment_length'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'total_donated'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'num_donation'
        );
        await userEvent.click(addPropertyBtn);
        await waitFor(async () => {
          expect(
            Array.from(container.querySelectorAll('.propertyInputRow')).length
          ).toEqual(9);
        });

        userEvent.click(await screen.findByText(/^Authentication Settings$/i));
        await screen.findByText(/^Authentication Type$/i);
        const authTypeInputContainer = container.querySelector(
          'label[for="modelAPI.authType"]'
        ) as HTMLElement;
        userEvent.click(
          authTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            authTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Basic Auth'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await screen.findByText(/^Username$/i);
        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.authTypeConfig.username"]'
          ) as HTMLInputElement,
          'test'
        );
        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.authTypeConfig.password"]'
          ) as HTMLInputElement,
          'p@ssword'
        );

        userEvent.click(saveBtn);
        expect(
          await screen.findByText(/^New API Configuration created$/i)
        ).toBeInTheDocument();
        expect(
          await screen.findByText(/^64d5a78656d3605a78346770$/i)
        ).toBeInTheDocument();
      },
      testTimeout
    );

    it(
      'should create the correct payload with POST form-urlencoded request body (tc003)',
      async () => {
        const mocks_tc003 = [
          {
            request: {
              query: GQL_CREATE_MODELAPI,
              variables: { model: saveConfigVariables_tc003 },
            },
            result: {
              data: saveConfigVariables_result,
            },
          },
        ];

        const { container } = render(
          <MockProviders apolloMocks={mocks_tc003}>
            <div id="aivModal"></div>
            <NewModelApiConfigModule />
          </MockProviders>
        );

        await screen.findByText(/^Create API Configuration$/i);
        const editNameBtn = await screen.findByTestId('editConfigIconBtn');
        const addPropertyBtn = await screen.findByTestId(
          'addRequestPropertyBtn'
        );
        const saveBtn = await screen.findByText(/^SAVE$/i);
        userEvent.click(editNameBtn);
        await screen.findByText(/^OK$/i);
        await userEvent.type(
          container.querySelector('input[name="name"]') as HTMLInputElement,
          'My test API'
        );
        await userEvent.type(
          container.querySelector(
            'textarea[name="description"]'
          ) as HTMLTextAreaElement,
          'My test API description'
        );
        const modelTypeInputContainer = container.querySelector(
          'label[for="modelType"]'
        ) as HTMLElement;
        userEvent.click(
          modelTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            modelTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Regression'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.url"]'
          ) as HTMLInputElement,
          'https://localhost:5000/predict/tc003'
        );
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'age'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'gender'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'race'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'income'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment_length'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'total_donated'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'num_donation'
        );
        await userEvent.click(addPropertyBtn);
        await waitFor(async () => {
          expect(
            Array.from(container.querySelectorAll('.propertyInputRow')).length
          ).toEqual(9);
        });

        userEvent.click(saveBtn);
        expect(
          await screen.findByText(/^New API Configuration created$/i)
        ).toBeInTheDocument();
        expect(
          await screen.findByText(/^64d5a78656d3605a78346770$/i)
        ).toBeInTheDocument();
      },
      testTimeout
    );

    it(
      'should create the correct payload with POST form-data request body (tc004)',
      async () => {
        const mocks_tc004 = [
          {
            request: {
              query: GQL_CREATE_MODELAPI,
              variables: { model: saveConfigVariables_tc004 },
            },
            result: {
              data: saveConfigVariables_result,
            },
          },
        ];

        const { container } = render(
          <MockProviders apolloMocks={mocks_tc004}>
            <div id="aivModal"></div>
            <NewModelApiConfigModule />
          </MockProviders>
        );

        await screen.findByText(/^Create API Configuration$/i);
        const editNameBtn = await screen.findByTestId('editConfigIconBtn');
        const addPropertyBtn = await screen.findByTestId(
          'addRequestPropertyBtn'
        );
        const saveBtn = await screen.findByText(/^SAVE$/i);
        userEvent.click(editNameBtn);
        await screen.findByText(/^OK$/i);
        await userEvent.type(
          container.querySelector('input[name="name"]') as HTMLInputElement,
          'My test API'
        );
        await userEvent.type(
          container.querySelector(
            'textarea[name="description"]'
          ) as HTMLTextAreaElement,
          'My test API description'
        );
        const modelTypeInputContainer = container.querySelector(
          'label[for="modelType"]'
        ) as HTMLElement;
        userEvent.click(
          modelTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            modelTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Regression'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.url"]'
          ) as HTMLInputElement,
          'https://localhost:5000/predict/tc004'
        );
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'age'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'gender'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'race'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'income'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment_length'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'total_donated'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'num_donation'
        );
        await userEvent.click(addPropertyBtn);
        await waitFor(async () => {
          expect(
            Array.from(container.querySelectorAll('.propertyInputRow')).length
          ).toEqual(9);
        });

        const mediaTypeInputContainer = container.querySelector(
          'label[for="modelAPI.requestBody.mediaType"]'
        ) as HTMLElement;
        userEvent.click(
          mediaTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            mediaTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'multipart/form-data'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        userEvent.click(saveBtn);
        expect(
          await screen.findByText(/^New API Configuration created$/i)
        ).toBeInTheDocument();
        expect(
          await screen.findByText(/^64d5a78656d3605a78346770$/i)
        ).toBeInTheDocument();
      },
      testTimeout
    );

    it(
      'should create the correct payload with GET query parameters (tc005)',
      async () => {
        const mocks_tc005 = [
          {
            request: {
              query: GQL_CREATE_MODELAPI,
              variables: { model: saveConfigVariables_tc005 },
            },
            result: {
              data: saveConfigVariables_result,
            },
          },
        ];

        const { container } = render(
          <MockProviders apolloMocks={mocks_tc005}>
            <div id="aivModal"></div>
            <NewModelApiConfigModule />
          </MockProviders>
        );

        await screen.findByText(/^Create API Configuration$/i);
        const editNameBtn = await screen.findByTestId('editConfigIconBtn');
        const saveBtn = await screen.findByText(/^SAVE$/i);
        userEvent.click(editNameBtn);
        await screen.findByText(/^OK$/i);
        await userEvent.type(
          container.querySelector('input[name="name"]') as HTMLInputElement,
          'My test API'
        );
        await userEvent.type(
          container.querySelector(
            'textarea[name="description"]'
          ) as HTMLTextAreaElement,
          'My test API description'
        );
        const modelTypeInputContainer = container.querySelector(
          'label[for="modelType"]'
        ) as HTMLElement;
        userEvent.click(
          modelTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            modelTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Regression'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        const methodInputContainer = container.querySelector(
          'label[for="modelAPI.method"]'
        ) as HTMLElement;
        userEvent.click(
          methodInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            methodInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).toEqual(2);
          const targetOption = options.find((opt) => opt.textContent === 'GET');
          console.log(targetOption?.textContent);
          userEvent.click(targetOption as HTMLElement);
        });

        await screen.findByText(/^URL Parameter Type$/i);
        await screen.findByText(/^Parameter Name$/i);
        const addUrlParamBtn = await screen.findByTestId('addUrlParamBtn');

        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.url"]'
          ) as HTMLInputElement,
          'https://localhost:5000/predict/tc005'
        );
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'age'
        );
        await userEvent.click(addUrlParamBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'gender'
        );
        await userEvent.click(addUrlParamBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'race'
        );
        await userEvent.click(addUrlParamBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'income'
        );
        await userEvent.click(addUrlParamBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'employment'
        );
        await userEvent.click(addUrlParamBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'employment_length'
        );
        await userEvent.click(addUrlParamBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'total_donated'
        );
        await userEvent.click(addUrlParamBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'num_donation'
        );
        await userEvent.click(addUrlParamBtn);
        await waitFor(async () => {
          const addedParams = await screen.findAllByTestId('urlParamInputRow');
          expect(addedParams.length).toEqual(9);
        });

        userEvent.click(saveBtn);
        expect(
          await screen.findByText(/^New API Configuration created$/i)
        ).toBeInTheDocument();
        expect(
          await screen.findByText(/^64d5a78656d3605a78346770$/i)
        ).toBeInTheDocument();
      },
      testTimeout
    );

    it(
      'should create the correct payload with GET path parameters (tc006)',
      async () => {
        const mocks_tc006 = [
          {
            request: {
              query: GQL_CREATE_MODELAPI,
              variables: { model: saveConfigVariables_tc006 },
            },
            result: {
              data: saveConfigVariables_result,
            },
          },
        ];

        const { container } = render(
          <MockProviders apolloMocks={mocks_tc006}>
            <div id="aivModal"></div>
            <NewModelApiConfigModule />
          </MockProviders>
        );

        await screen.findByText(/^Create API Configuration$/i);
        const editNameBtn = await screen.findByTestId('editConfigIconBtn');
        const saveBtn = await screen.findByText(/^SAVE$/i);
        userEvent.click(editNameBtn);
        await screen.findByText(/^OK$/i);
        await userEvent.type(
          container.querySelector('input[name="name"]') as HTMLInputElement,
          'My test API'
        );
        await userEvent.type(
          container.querySelector(
            'textarea[name="description"]'
          ) as HTMLTextAreaElement,
          'My test API description'
        );
        const modelTypeInputContainer = container.querySelector(
          'label[for="modelType"]'
        ) as HTMLElement;
        userEvent.click(
          modelTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            modelTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Regression'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        const methodInputContainer = container.querySelector(
          'label[for="modelAPI.method"]'
        ) as HTMLElement;
        userEvent.click(
          methodInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            methodInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).toEqual(2);
          const targetOption = options.find((opt) => opt.textContent === 'GET');
          userEvent.click(targetOption as HTMLElement);
        });

        await screen.findByText(/^URL Parameter Type$/i);
        await screen.findByText(/^Parameter Name$/i);

        const paramTypeInputContainer = container.querySelector(
          'label[for="modelAPI.parameters.paramType"]'
        ) as HTMLElement;
        userEvent.click(
          paramTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            paramTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).toEqual(2);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Path'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        // await screen.findByText('e.g. https://hostname/predict/{age}/{gender}');
        const addUrlParamBtn = await screen.findByTestId('addUrlParamBtn');

        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.url"]'
          ) as HTMLInputElement,
          'https://localhost:5000/predict/tc006'
        );
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'age'
        );
        await userEvent.click(addUrlParamBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'gender'
        );
        await userEvent.click(addUrlParamBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'race'
        );
        await userEvent.click(addUrlParamBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'income'
        );
        await userEvent.click(addUrlParamBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'employment'
        );
        await userEvent.click(addUrlParamBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'employment_length'
        );
        await userEvent.click(addUrlParamBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'total_donated'
        );
        await userEvent.click(addUrlParamBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="urlParamName"]'
          ) as HTMLInputElement,
          'num_donation'
        );
        await userEvent.click(addUrlParamBtn);
        await waitFor(async () => {
          const addedParams = await screen.findAllByTestId('urlParamInputRow');
          expect(addedParams.length).toEqual(9);
        });

        userEvent.click(saveBtn);
        expect(
          await screen.findByText(/^New API Configuration created$/i)
        ).toBeInTheDocument();
        expect(
          await screen.findByText(/^64d5a78656d3605a78346770$/i)
        ).toBeInTheDocument();
      },
      testTimeout
    );
    //tc007
    it(
      'should create the correct payload with POST application/json response media type (tc007)',
      async () => {
        const mocks_tc007 = [
          {
            request: {
              query: GQL_CREATE_MODELAPI,
              variables: { model: saveConfigVariables_tc007 },
            },
            result: {
              data: saveConfigVariables_result,
            },
          },
        ];

        const { container } = render(
          <MockProviders apolloMocks={mocks_tc007}>
            <div id="aivModal"></div>
            <NewModelApiConfigModule />
          </MockProviders>
        );

        await screen.findByText(/^Create API Configuration$/i);
        const editNameBtn = await screen.findByTestId('editConfigIconBtn');
        const addPropertyBtn = await screen.findByTestId(
          'addRequestPropertyBtn'
        );
        const saveBtn = await screen.findByText(/^SAVE$/i);
        userEvent.click(editNameBtn);
        await screen.findByText(/^OK$/i);
        await userEvent.type(
          container.querySelector('input[name="name"]') as HTMLInputElement,
          'My test API'
        );
        await userEvent.type(
          container.querySelector(
            'textarea[name="description"]'
          ) as HTMLTextAreaElement,
          'My test API description'
        );
        const modelTypeInputContainer = container.querySelector(
          'label[for="modelType"]'
        ) as HTMLElement;
        userEvent.click(
          modelTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            modelTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Regression'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.url"]'
          ) as HTMLInputElement,
          'https://localhost:5000/predict/tc007'
        );
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'age'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'gender'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'race'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'income'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment_length'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'total_donated'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'num_donation'
        );
        await userEvent.click(addPropertyBtn);
        await waitFor(async () => {
          expect(
            Array.from(container.querySelectorAll('.propertyInputRow')).length
          ).toEqual(9);
        });

        userEvent.click(await screen.findByText(/^Response Properties$/i));
        await screen.findByText(/^Success Status Code$/i);
        expect(screen.queryByText(/^Field Name$/i)).toBeNull();

        const responseMediaTypeInputContainer = container.querySelector(
          'label[for="modelAPI.response.mediaType"]'
        ) as HTMLElement;
        userEvent.click(
          responseMediaTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            responseMediaTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).toEqual(2);
          const targetOption = options.find(
            (opt) => opt.textContent === 'application/json'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        const dataTypeInputContainer = container.querySelector(
          'label[for="modelAPI.response.schema.type"]'
        ) as HTMLElement;
        userEvent.click(
          dataTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            dataTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).toEqual(2);
          const targetOption = options.find(
            (opt) => opt.textContent === 'object'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await screen.findByText(/^Field Name$/i);
        await screen.findByText(/^Field Data Type$/i);

        userEvent.click(saveBtn);
        expect(
          await screen.findByText(/^New API Configuration created$/i)
        ).toBeInTheDocument();
        expect(
          await screen.findByText(/^64d5a78656d3605a78346770$/i)
        ).toBeInTheDocument();
      },
      testTimeout
    );
    //tc008
    it(
      'should create the correct payload with POST additional headers (tc008)',
      async () => {
        const mocks_tc008 = [
          {
            request: {
              query: GQL_CREATE_MODELAPI,
              variables: { model: saveConfigVariables_tc008 },
            },
            result: {
              data: saveConfigVariables_result,
            },
          },
        ];

        const { container } = render(
          <MockProviders apolloMocks={mocks_tc008}>
            <div id="aivModal"></div>
            <NewModelApiConfigModule />
          </MockProviders>
        );

        await screen.findByText(/^Create API Configuration$/i);
        const editNameBtn = await screen.findByTestId('editConfigIconBtn');
        const addPropertyBtn = await screen.findByTestId(
          'addRequestPropertyBtn'
        );
        const saveBtn = await screen.findByText(/^SAVE$/i);
        userEvent.click(editNameBtn);
        await screen.findByText(/^OK$/i);
        await userEvent.type(
          container.querySelector('input[name="name"]') as HTMLInputElement,
          'My test API'
        );
        await userEvent.type(
          container.querySelector(
            'textarea[name="description"]'
          ) as HTMLTextAreaElement,
          'My test API description'
        );
        const modelTypeInputContainer = container.querySelector(
          'label[for="modelType"]'
        ) as HTMLElement;
        userEvent.click(
          modelTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            modelTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Regression'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.url"]'
          ) as HTMLInputElement,
          'https://localhost:5000/predict/tc008'
        );
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'age'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'gender'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'race'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'income'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment_length'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'total_donated'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'num_donation'
        );
        await userEvent.click(addPropertyBtn);
        await waitFor(async () => {
          expect(
            Array.from(container.querySelectorAll('.propertyInputRow')).length
          ).toEqual(9);
        });

        userEvent.click(
          await screen.findByText(/^Additional Request Headers$/i)
        );
        await screen.findByText(/^Header Name$/i);

        const headerTypeInputContainer = container.querySelector(
          'label[for="headerTypeInput"]'
        ) as HTMLElement;
        userEvent.click(
          headerTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            headerTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'string'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await userEvent.type(
          container.querySelector(
            'input[name="headerNameInput"]'
          ) as HTMLInputElement,
          'foo'
        );
        await userEvent.type(
          container.querySelector(
            'input[name="headerValueInput"]'
          ) as HTMLInputElement,
          'bar'
        );
        userEvent.click(await screen.findByTestId('headerAddBtn'));
        await waitFor(async () => {
          const addedHeaders = await screen.findAllByTestId(
            'additionalHeaderInputRow'
          );
          expect(addedHeaders.length).toEqual(2);
        });

        userEvent.click(saveBtn);
        expect(
          await screen.findByText(/^New API Configuration created$/i)
        ).toBeInTheDocument();
        expect(
          await screen.findByText(/^64d5a78656d3605a78346770$/i)
        ).toBeInTheDocument();
      },
      testTimeout
    );
    //tc009
    it(
      'should create the correct payload with connection settings (tc009)',
      async () => {
        const mocks_tc009 = [
          {
            request: {
              query: GQL_CREATE_MODELAPI,
              variables: { model: saveConfigVariables_tc009 },
            },
            result: {
              data: saveConfigVariables_result,
            },
          },
        ];

        const { container } = render(
          <MockProviders apolloMocks={mocks_tc009}>
            <div id="aivModal"></div>
            <NewModelApiConfigModule />
          </MockProviders>
        );

        await screen.findByText(/^Create API Configuration$/i);
        const editNameBtn = await screen.findByTestId('editConfigIconBtn');
        const addPropertyBtn = await screen.findByTestId(
          'addRequestPropertyBtn'
        );
        const saveBtn = await screen.findByText(/^SAVE$/i);
        userEvent.click(editNameBtn);
        await screen.findByText(/^OK$/i);
        await userEvent.type(
          container.querySelector('input[name="name"]') as HTMLInputElement,
          'My test API'
        );
        await userEvent.type(
          container.querySelector(
            'textarea[name="description"]'
          ) as HTMLTextAreaElement,
          'My test API description'
        );
        const modelTypeInputContainer = container.querySelector(
          'label[for="modelType"]'
        ) as HTMLElement;
        userEvent.click(
          modelTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            modelTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Regression'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.url"]'
          ) as HTMLInputElement,
          'https://localhost:5000/predict/tc009'
        );
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'age'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'gender'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'race'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'income'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment_length'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'total_donated'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'num_donation'
        );
        await userEvent.click(addPropertyBtn);
        await waitFor(async () => {
          expect(
            Array.from(container.querySelectorAll('.propertyInputRow')).length
          ).toEqual(9);
        });

        userEvent.click(await screen.findByText(/^Connection Settings$/i));
        await screen.findByText(/^SSL Verify$/i);

        const sslVerifyCheckbox = container.querySelector(
          'input[name="modelAPI.requestConfig.sslVerify"]'
        ) as HTMLInputElement;
        const connectionTimeoutInput = container.querySelector(
          'input[name="modelAPI.requestConfig.connectionTimeout"]'
        ) as HTMLInputElement;
        const connectionRetriesInput = container.querySelector(
          'input[name="modelAPI.requestConfig.connectionRetries"]'
        ) as HTMLInputElement;
        const maxConnectionsInput = container.querySelector(
          'input[name="modelAPI.requestConfig.maxConnections"]'
        ) as HTMLInputElement;
        const rateLimitInput = container.querySelector(
          'input[name="modelAPI.requestConfig.rateLimit"]'
        ) as HTMLInputElement;
        const rateLimitTimeoutInput = container.querySelector(
          'input[name="modelAPI.requestConfig.rateLimitTimeout"]'
        ) as HTMLInputElement;

        expect(rateLimitTimeoutInput.getAttribute('disabled')).toBe('');
        expect(rateLimitTimeoutInput.getAttribute('disabled')).not.toBeNull();

        userEvent.click(sslVerifyCheckbox);
        await userEvent.clear(connectionTimeoutInput);
        await userEvent.type(connectionTimeoutInput, '4');
        expect(connectionTimeoutInput).toHaveValue('4');
        await userEvent.clear(connectionRetriesInput);
        await userEvent.type(connectionRetriesInput, '5');
        expect(connectionRetriesInput).toHaveValue('5');
        await userEvent.clear(maxConnectionsInput);
        await userEvent.type(maxConnectionsInput, '3');
        expect(maxConnectionsInput).toHaveValue('3');
        await userEvent.clear(rateLimitInput);
        await userEvent.type(rateLimitInput, '5');
        expect(rateLimitInput).toHaveValue('5');

        await waitFor(async () => {
          expect(rateLimitTimeoutInput.getAttribute('disabled')).not.toBe('');
          expect(rateLimitTimeoutInput.getAttribute('disabled')).toBeNull();
        });

        await userEvent.clear(rateLimitTimeoutInput);
        await userEvent.type(rateLimitTimeoutInput, '10');
        expect(rateLimitTimeoutInput).toHaveValue('10');

        userEvent.click(saveBtn);
        expect(
          await screen.findByText(/^New API Configuration created$/i)
        ).toBeInTheDocument();
        expect(
          await screen.findByText(/^64d5a78656d3605a78346770$/i)
        ).toBeInTheDocument();
      },
      testTimeout
    );
    //tc0013
    it(
      'should create the correct payload with POST, application/json response media type and array of integers response schema (tc013)',
      async () => {
        const mocks_tc013 = [
          {
            request: {
              query: GQL_CREATE_MODELAPI,
              variables: { model: saveConfigVariables_tc013 },
            },
            result: {
              data: saveConfigVariables_result,
            },
          },
        ];

        const { container } = render(
          <MockProviders apolloMocks={mocks_tc013}>
            <div id="aivModal"></div>
            <NewModelApiConfigModule />
          </MockProviders>
        );

        await screen.findByText(/^Create API Configuration$/i);
        const editNameBtn = await screen.findByTestId('editConfigIconBtn');
        const addPropertyBtn = await screen.findByTestId(
          'addRequestPropertyBtn'
        );
        const saveBtn = await screen.findByText(/^SAVE$/i);
        userEvent.click(editNameBtn);
        await screen.findByText(/^OK$/i);
        await userEvent.type(
          container.querySelector('input[name="name"]') as HTMLInputElement,
          'My test API'
        );
        await userEvent.type(
          container.querySelector(
            'textarea[name="description"]'
          ) as HTMLTextAreaElement,
          'My test API description'
        );
        const modelTypeInputContainer = container.querySelector(
          'label[for="modelType"]'
        ) as HTMLElement;
        userEvent.click(
          modelTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            modelTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Regression'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.url"]'
          ) as HTMLInputElement,
          'https://localhost:5000/predict/tc013'
        );

        const requestMediaTypeInputContainer = container.querySelector(
          'label[for="modelAPI.requestBody.mediaType"]'
        ) as HTMLElement;
        userEvent.click(
          requestMediaTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );

        const batchStrategyContainer = container.querySelector(
          'label[for="modelAPI.requestConfig.batchStrategy"]'
        ) as HTMLElement;
        userEvent.click(
          batchStrategyContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );

        const batchLimitInput = container.querySelector(
          'input[name="modelAPI.requestConfig.batchLimit"]'
        ) as HTMLInputElement;
        expect(batchLimitInput.getAttribute('disabled')).toBe('');

        await waitFor(async () => {
          const options = Array.from(
            batchStrategyContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).toBe(2);
          const targetOption = options.find(
            (opt) => opt.textContent === 'enabled'
          );
          await userEvent.click(targetOption as HTMLElement);
          await waitFor(() => {
            expect(
              (
                requestMediaTypeInputContainer.querySelector(
                  '.aiv__single-value '
                ) as HTMLElement
              ).textContent
            ).toBe(MediaType.APP_JSON);
          });
        });

        await waitFor(async () =>
          expect(batchLimitInput.getAttribute('disabled')).not.toBe('')
        );
        await userEvent.clear(batchLimitInput);
        await userEvent.type(batchLimitInput, '100');

        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'age'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'gender'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'race'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'income'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment_length'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'total_donated'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'num_donation'
        );
        await userEvent.click(addPropertyBtn);
        await waitFor(async () => {
          expect(
            Array.from(container.querySelectorAll('.propertyInputRow')).length
          ).toEqual(9);
        });

        userEvent.click(await screen.findByText(/^Response Properties$/i));
        await screen.findByText(/^Success Status Code$/i);
        expect(screen.queryByText(/^Field Name$/i)).toBeNull();

        const responseMediaTypeInputContainer = container.querySelector(
          'label[for="modelAPI.response.mediaType"]'
        ) as HTMLElement;
        await waitFor(() => {
          expect(
            (
              responseMediaTypeInputContainer.querySelector(
                '.aiv__single-value '
              ) as HTMLElement
            ).textContent
          ).toBe(MediaType.APP_JSON);
        });
        expect(
          responseMediaTypeInputContainer.querySelector('.aiv--is-disabled')
        ).not.toBeNull();

        const dataTypeInputContainer = container.querySelector(
          'label[for="modelAPI.response.schema.type"]'
        ) as HTMLElement;
        userEvent.click(
          dataTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            dataTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).toEqual(2);
          const targetOption = options.find(
            (opt) => opt.textContent === 'array'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await screen.findByText(/^Array Items Data Type$/i);

        await userEvent.click(saveBtn);
        expect(
          await screen.findByText(/^New API Configuration created$/i)
        ).toBeInTheDocument();
        expect(
          await screen.findByText(/^64d5a78656d3605a78346770$/i)
        ).toBeInTheDocument();
      },
      testTimeout
    );
    //tc0014
    it(
      'should create the correct payload with POST, application/json response media type and array of objects response schema (tc014)',
      async () => {
        const mocks_tc014 = [
          {
            request: {
              query: GQL_CREATE_MODELAPI,
              variables: { model: saveConfigVariables_tc014 },
            },
            result: {
              data: saveConfigVariables_result,
            },
          },
        ];

        const { container } = render(
          <MockProviders apolloMocks={mocks_tc014}>
            <div id="aivModal"></div>
            <NewModelApiConfigModule />
          </MockProviders>
        );

        await screen.findByText(/^Create API Configuration$/i);
        const editNameBtn = await screen.findByTestId('editConfigIconBtn');
        const addPropertyBtn = await screen.findByTestId(
          'addRequestPropertyBtn'
        );
        const saveBtn = await screen.findByText(/^SAVE$/i);
        userEvent.click(editNameBtn);
        await screen.findByText(/^OK$/i);
        await userEvent.type(
          container.querySelector('input[name="name"]') as HTMLInputElement,
          'My test API'
        );
        await userEvent.type(
          container.querySelector(
            'textarea[name="description"]'
          ) as HTMLTextAreaElement,
          'My test API description'
        );
        const modelTypeInputContainer = container.querySelector(
          'label[for="modelType"]'
        ) as HTMLElement;
        userEvent.click(
          modelTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            modelTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Regression'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        const requestMediaTypeInputContainer = container.querySelector(
          'label[for="modelAPI.requestBody.mediaType"]'
        ) as HTMLElement;
        userEvent.click(
          requestMediaTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            requestMediaTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).toEqual(3);
          const targetOption = options.find(
            (opt) => opt.textContent === 'application/json'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.url"]'
          ) as HTMLInputElement,
          'https://localhost:5000/predict/tc014'
        );

        const batchStrategyContainer = container.querySelector(
          'label[for="modelAPI.requestConfig.batchStrategy"]'
        ) as HTMLElement;
        userEvent.click(
          batchStrategyContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            batchStrategyContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'enabled'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'age'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'gender'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'race'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'income'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment_length'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'total_donated'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'num_donation'
        );
        await userEvent.click(addPropertyBtn);
        await waitFor(async () => {
          expect(
            Array.from(container.querySelectorAll('.propertyInputRow')).length
          ).toEqual(9);
        });

        userEvent.click(await screen.findByText(/^Response Properties$/i));
        await screen.findByText(/^Success Status Code$/i);
        expect(screen.queryByText(/^Field Name$/i)).toBeNull();

        const responseMediaTypeInputContainer = container.querySelector(
          'label[for="modelAPI.response.mediaType"]'
        ) as HTMLElement;
        await waitFor(() => {
          expect(
            (
              requestMediaTypeInputContainer.querySelector(
                '.aiv__single-value '
              ) as HTMLElement
            ).textContent
          ).toBe(MediaType.APP_JSON);
        });
        expect(
          responseMediaTypeInputContainer.querySelector('.aiv--is-disabled')
        ).not.toBeNull();

        const dataTypeInputContainer = container.querySelector(
          'label[for="modelAPI.response.schema.type"]'
        ) as HTMLElement;
        userEvent.click(
          dataTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            dataTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).toEqual(2);
          const targetOption = options.find(
            (opt) => opt.textContent === 'array'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await screen.findByText(/^Array Items Data Type$/i);

        const arrItemsInputContainer = container.querySelector(
          'label[for="modelAPI.response.schema.items.type"]'
        ) as HTMLElement;
        userEvent.click(
          arrItemsInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            arrItemsInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).toEqual(5);
          const targetOption = options.find(
            (opt) => opt.textContent === 'object'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await screen.findByText(/^Describe the Array Item Object$/i);

        userEvent.click(saveBtn);
        expect(
          await screen.findByText(/^New API Configuration created$/i)
        ).toBeInTheDocument();
        expect(
          await screen.findByText(/^64d5a78656d3605a78346770$/i)
        ).toBeInTheDocument();
      },
      testTimeout
    );
    //tc0015
    it(
      'should create the correct payload with POST, application/json response media type and object of array response schema (tc015)',
      async () => {
        const mocks_tc015 = [
          {
            request: {
              query: GQL_CREATE_MODELAPI,
              variables: { model: saveConfigVariables_tc015 },
            },
            result: {
              data: saveConfigVariables_result,
            },
          },
        ];

        const { container } = render(
          <MockProviders apolloMocks={mocks_tc015}>
            <div id="aivModal"></div>
            <NewModelApiConfigModule />
          </MockProviders>
        );

        await screen.findByText(/^Create API Configuration$/i);
        const editNameBtn = await screen.findByTestId('editConfigIconBtn');
        const addPropertyBtn = await screen.findByTestId(
          'addRequestPropertyBtn'
        );
        const saveBtn = await screen.findByText(/^SAVE$/i);
        userEvent.click(editNameBtn);
        await screen.findByText(/^OK$/i);
        await userEvent.type(
          container.querySelector('input[name="name"]') as HTMLInputElement,
          'My test API'
        );
        await userEvent.type(
          container.querySelector(
            'textarea[name="description"]'
          ) as HTMLTextAreaElement,
          'My test API description'
        );
        const modelTypeInputContainer = container.querySelector(
          'label[for="modelType"]'
        ) as HTMLElement;
        userEvent.click(
          modelTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            modelTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'Regression'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        const requestMediaTypeInputContainer = container.querySelector(
          'label[for="modelAPI.requestBody.mediaType"]'
        ) as HTMLElement;
        userEvent.click(
          requestMediaTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            requestMediaTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).toEqual(3);
          const targetOption = options.find(
            (opt) => opt.textContent === 'application/json'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await userEvent.type(
          container.querySelector(
            'input[name="modelAPI.url"]'
          ) as HTMLInputElement,
          'https://localhost:5000/predict/tc015'
        );

        const batchStrategyContainer = container.querySelector(
          'label[for="modelAPI.requestConfig.batchStrategy"]'
        ) as HTMLElement;
        userEvent.click(
          batchStrategyContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            batchStrategyContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).not.toBe(0);
          const targetOption = options.find(
            (opt) => opt.textContent === 'enabled'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'age'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'gender'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'race'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'income'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'employment_length'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'total_donated'
        );
        await userEvent.click(addPropertyBtn);
        await userEvent.type(
          container.querySelector(
            'input[name="reqBodyParamName"]'
          ) as HTMLInputElement,
          'num_donation'
        );
        await userEvent.click(addPropertyBtn);
        await waitFor(async () => {
          expect(
            Array.from(container.querySelectorAll('.propertyInputRow')).length
          ).toEqual(9);
        });

        userEvent.click(await screen.findByText(/^Response Properties$/i));
        await screen.findByText(/^Success Status Code$/i);
        expect(screen.queryByText(/^Field Name$/i)).toBeNull();

        const responseMediaTypeInputContainer = container.querySelector(
          'label[for="modelAPI.response.mediaType"]'
        ) as HTMLElement;
        await waitFor(() => {
          expect(
            (
              requestMediaTypeInputContainer.querySelector(
                '.aiv__single-value '
              ) as HTMLElement
            ).textContent
          ).toBe(MediaType.APP_JSON);
        });
        expect(
          responseMediaTypeInputContainer.querySelector('.aiv--is-disabled')
        ).not.toBeNull();

        const dataTypeInputContainer = container.querySelector(
          'label[for="modelAPI.response.schema.type"]'
        ) as HTMLElement;
        userEvent.click(
          dataTypeInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            dataTypeInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).toEqual(2);
          const targetOption = options.find(
            (opt) => opt.textContent === 'object'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await screen.findByText(/^Field Data Type$/i);
        await screen.findByText(/^Field Name$/i);

        const arrItemsInputContainer = container.querySelector(
          'label[for="modelAPI.response.fieldValueType"]'
        ) as HTMLElement;
        userEvent.click(
          arrItemsInputContainer.querySelector(
            '.aiv__dropdown-indicator'
          ) as HTMLElement
        );
        await waitFor(async () => {
          const options = Array.from(
            arrItemsInputContainer.querySelectorAll('.aiv__option')
          );
          expect(options.length).toEqual(5);
          const targetOption = options.find(
            (opt) => opt.textContent === 'array'
          );
          userEvent.click(targetOption as HTMLElement);
        });

        await screen.findByText(/^Describe the Field Array Item$/i);

        userEvent.click(saveBtn);
        expect(
          await screen.findByText(/^New API Configuration created$/i)
        ).toBeInTheDocument();
        expect(
          await screen.findByText(/^64d5a78656d3605a78346770$/i)
        ).toBeInTheDocument();
      },
      testTimeout
    );
  });

  describe('GraphQL Model API Config Payloads (Form Errors)', () => {
    it('should show field level error messages (POST method)', async () => {
      const { container } = render(
        <MockProviders>
          <div id="aivModal"></div>
          <NewModelApiConfigModule />
        </MockProviders>
      );
      const user = userEvent.setup();
      await screen.findByText(/^Create API Configuration$/i);
      const saveBtn = await screen.findByText(/^SAVE$/i);
      user.click(saveBtn);
      await screen.findByText(/^Field-level errors$/i);
      await screen.findByText(/^Config Name$/i);
      expect((await screen.findAllByText(/^Required$/i)).length).toBe(3);

      const batchStrategyContainer = container.querySelector(
        'label[for="modelAPI.requestConfig.batchStrategy"]'
      ) as HTMLElement;
      user.click(
        batchStrategyContainer.querySelector(
          '.aiv__dropdown-indicator'
        ) as HTMLElement
      );
      await waitFor(async () => {
        const options = Array.from(
          batchStrategyContainer.querySelectorAll('.aiv__option')
        );
        expect(options.length).not.toBe(0);
        const targetOption = options.find(
          (opt) => opt.textContent === 'enabled'
        );
        user.click(targetOption as HTMLElement);
      });

      const batchLimitInput = container.querySelector(
        'input[name="modelAPI.requestConfig.batchLimit"]'
      ) as HTMLInputElement;
      await waitFor(async () =>
        expect(batchLimitInput.getAttribute('disabled')).toBeNull()
      );
      await user.clear(batchLimitInput);
      expect((await screen.findAllByText(/^Required$/i)).length).toBe(4);

      user.click(await screen.findByText(/^Response Properties$/i));
      await screen.findByText(/^Success Status Code$/i);
      const statusCodeInput = container.querySelector(
        'input[name="modelAPI.response.statusCode"]'
      ) as HTMLInputElement;
      await user.clear(statusCodeInput);
      expect((await screen.findAllByText(/^Required$/i)).length).toBe(4);

      user.click(await screen.findByText(/^Authentication Settings$/i));
      await screen.findByText(/^Authentication Type$/i);
      expect((await screen.findAllByText(/^Required$/i)).length).toBe(3);

      const authTypeInputContainer = container.querySelector(
        'label[for="modelAPI.authType"]'
      ) as HTMLElement;
      user.click(
        authTypeInputContainer.querySelector(
          '.aiv__dropdown-indicator'
        ) as HTMLElement
      );
      await waitFor(async () => {
        const options = Array.from(
          authTypeInputContainer.querySelectorAll('.aiv__option')
        );
        expect(options.length).not.toBe(0);
        const targetOption = options.find(
          (opt) => opt.textContent === 'Bearer Token'
        );
        user.click(targetOption as HTMLElement);
      });
      await screen.findByText(/^Token$/i);
      await user.clear(
        container.querySelector(
          'input[name="modelAPI.authTypeConfig.token"]'
        ) as HTMLInputElement
      );
      expect((await screen.findAllByText(/^Required$/i)).length).toBe(4);
      user.click(await screen.findByText(/^Connection Settings$/i));
      await screen.findByText(/^SSL Verify$/i);
      expect((await screen.findAllByText(/^Required$/i)).length).toBe(3);

      await user.clear(
        container.querySelector(
          'input[name="modelAPI.requestConfig.connectionTimeout"]'
        ) as HTMLInputElement
      );
      await user.clear(
        container.querySelector(
          'input[name="modelAPI.requestConfig.connectionRetries"]'
        ) as HTMLInputElement
      );
      await user.clear(
        container.querySelector(
          'input[name="modelAPI.requestConfig.maxConnections"]'
        ) as HTMLInputElement
      );
      await user.clear(
        container.querySelector(
          'input[name="modelAPI.requestConfig.rateLimit"]'
        ) as HTMLInputElement
      );
      await waitFor(async () => {
        expect((await screen.findAllByText(/^Required$/i)).length).toBe(6);
      });

      await user.type(
        container.querySelector(
          'textArea[name="description"]'
        ) as HTMLTextAreaElement,
        'test'
      );
      await screen.findByText(/^Min 20 characters$/i);
      expect((await screen.findAllByText(/^Required$/i)).length).toBe(5);
    });
  });
});
