import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

// Add NEXT_PUBLIC_ prefix to the following env variables to expose them to browser side.
const URL =
  process.env.SERVER_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  'http://localhost:3000';
const WSURL =
  process.env.WEBSOCKET_URL ||
  process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
  'ws://localhost:4000/graphql';

/**
 * Create a new apollo client
 * @param ssrMode set true to enable ssrMode for server-side rendering
 * @returns apollo client object
 */
export default function graphqlClient(ssrMode = false) {
  const httpLink = new HttpLink({ uri: `${URL}/api/graphql` });
  const wsLink =
    typeof window !== 'undefined'
      ? new GraphQLWsLink(
          createClient({
            url: WSURL,
          })
        )
      : null;

  const link =
    typeof window !== 'undefined' && wsLink != null
      ? split(
          ({ query }) => {
            const def = getMainDefinition(query);
            return (
              def.kind === 'OperationDefinition' &&
              def.operation === 'subscription'
            );
          },
          wsLink,
          httpLink
        )
      : httpLink;

  const client = new ApolloClient({
    ssrMode,
    // uri: '/api/graphql/',
    link: link,
    cache: new InMemoryCache(),
  });

  return client;
}
