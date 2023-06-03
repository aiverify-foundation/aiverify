import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { constraintDirective, constraintDirectiveTypeDefs } from 'graphql-constraint-directive';
import { WebSocketServer } from 'ws'; // yarn add ws
import { useServer } from 'graphql-ws/lib/use/ws';
import typeDefs from './typeDefs.mjs'
import resolvers from './resolvers.mjs'
// import { makeExecutableSchema } from 'graphql-tools';
import { makeExecutableSchema } from '@graphql-tools/schema';
import * as graphqlScalers from 'graphql-scalars';


export function createApolloServer(httpServer) {
  /* merge with graphql scalers */
  let schema = makeExecutableSchema({
    typeDefs: [
      ...graphqlScalers.typeDefs,
      constraintDirectiveTypeDefs,
      typeDefs
    ],
    resolvers: {
      ...graphqlScalers.resolvers,
      ...resolvers,
    },
  });
  schema = constraintDirective()(schema);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer({ schema }, wsServer);

  // Set up Apollo Server
  const server = new ApolloServer({
    // typeDefs,
    // resolvers,
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  return server;
}