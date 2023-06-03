import { ApolloServer } from '@apollo/server';
// import { startStandaloneServer } from '@apollo/server/standalone';
import { constraintDirective, constraintDirectiveTypeDefs } from 'graphql-constraint-directive';
import { makeExecutableSchema } from '@graphql-tools/schema';
import * as graphqlScalers from 'graphql-scalars';

import typeDefs from '#graphql/typeDefs.mjs';
// import resolvers from '#graphql/resolvers.mjs'

export function createApolloServer(resolvers) {
  // console.log("resolvers", resolvers);
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

  const testServer = new ApolloServer({
    schema
  });

  return testServer;
}