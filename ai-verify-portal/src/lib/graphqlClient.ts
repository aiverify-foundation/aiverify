import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

/**
 * Create a new apollo client
 * @param ssrMode set true to enable ssrMode for server-side rendering
 * @returns apollo client object
 */
export default function graphqlClient(ssrMode = false) {
  const isClient = typeof window !== 'undefined' && !ssrMode;
  // if client use relative path, if server mode connect direct to api-gw
  const uri = isClient ? '/api/graphql' : `${process.env.APIGW_URL}/graphql`;
  const httpLink = new HttpLink({ uri: uri });

  let wsLink = null;
  if (isClient) {
    // only connect to graphql subscription for client
    // if env WEBSOCKET_URL not defined, assume api-gw always hosted on the same host
    const wsprot = window.location.protocol === 'http:'?'ws':'wss';
    const wsuri = process.env.NEXT_PUBLIC_WEBSOCKET_URL || `${wsprot}://${window.location.hostname}:${window.location.port}/api/graphql`;
    // console.log("wsuri:", wsuri);
    wsLink = new GraphQLWsLink(
      createClient({
        url: wsuri,
      })
    );
  }

  // console.log("uri:", uri);
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
