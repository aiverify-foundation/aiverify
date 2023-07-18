import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { NotificationsProvider } from 'src/modules/notifications/providers/notificationsContext';
import { PropsWithChildren } from 'react';

type MockProvidersProps = {
  apolloMocks?:
    | MockedResponse<Record<string, any>, Record<string, any>>[]
    | undefined;
};

function MockProviders(props: PropsWithChildren<MockProvidersProps>) {
  const { apolloMocks, children } = props;
  return (
    <MockedProvider mocks={apolloMocks} addTypename={false}>
      <NotificationsProvider>{children}</NotificationsProvider>
    </MockedProvider>
  );
}

export { MockProviders };
