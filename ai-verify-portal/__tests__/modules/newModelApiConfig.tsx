import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockProviders } from '__mocks__/mockProviders';
import { silentConsoleLogs } from '__mocks__/mockGlobals';
import { NewModelApiConfigModule } from 'src/modules/assets/modelAPIComponent';
import * as apolloClient from '@apollo/client';

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

  describe('GraphQL Model API Config Payloads', () => {
    const addNewModelAPIConfigSpy = jest.fn();
    beforeAll(() => {
      jest.mock('@apollo/client', () => ({
        useMutation: jest.fn(() => [addNewModelAPIConfigSpy]),
      }));
    });

    it('should create the correct payload', async () => {
      const { container } = render(
        <MockProviders>
          <NewModelApiConfigModule />
        </MockProviders>
      );

      await screen.findByText(/^Create API Configuration$/i);
      const editNameBtn = await screen.findByTestId('editConfigIconBtn');
      const addPropertyBtn = await screen.findByTestId('addRequestPropertyBtn');
      const saveBtn = await screen.findByText(/^SAVE$/i);
      userEvent.click(editNameBtn);
      await screen.findByText(/^OK$/i);
      await userEvent.type(
        container.querySelector('input[name="name"]') as HTMLInputElement,
        'My test API'
      );
      await userEvent.type(
        container.querySelector('input[name="name"]') as HTMLInputElement,
        'My test API description'
      );
      await userEvent.type(
        container.querySelector('input[name="modelType"]') as HTMLInputElement,
        'Regression'
      );
      await userEvent.type(
        container.querySelector(
          'input[name="modelAPI.url"]'
        ) as HTMLInputElement,
        'https://localhost:5000/predict/tc001'
      );
      await userEvent.type(
        container.querySelector('input[name="paramName"]') as HTMLInputElement,
        'age'
      );
      await userEvent.click(addPropertyBtn);
      await userEvent.type(
        container.querySelector('input[name="paramName"]') as HTMLInputElement,
        'gender'
      );
      await userEvent.click(addPropertyBtn);
      await userEvent.type(
        container.querySelector('input[name="paramName"]') as HTMLInputElement,
        'race'
      );
      await userEvent.click(addPropertyBtn);
      await userEvent.type(
        container.querySelector('input[name="paramName"]') as HTMLInputElement,
        'income'
      );
      await userEvent.click(addPropertyBtn);
      await userEvent.type(
        container.querySelector('input[name="paramName"]') as HTMLInputElement,
        'employment'
      );
      await userEvent.click(addPropertyBtn);
      await userEvent.type(
        container.querySelector('input[name="paramName"]') as HTMLInputElement,
        'employment_length'
      );
      await userEvent.click(addPropertyBtn);
      await userEvent.type(
        container.querySelector('input[name="paramName"]') as HTMLInputElement,
        'num_donation'
      );
      await userEvent.click(addPropertyBtn);
      await waitFor(async () => {
        expect(
          Array.from(container.querySelectorAll('.propertyInputRow')).length
        ).toEqual(8);
      });

      await userEvent.click(saveBtn);
      await waitFor(async () => {
        expect(addNewModelAPIConfigSpy).toHaveBeenCalled();
      });
    }, 10000);
  });
});
