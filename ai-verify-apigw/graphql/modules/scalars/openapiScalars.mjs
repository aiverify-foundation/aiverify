import { GraphQLScalarType, GraphQLError, Kind } from 'graphql';

// Validation function for checking MediaTypes
function _mediaType(value) {
  if (typeof value === 'string') {
    switch (value) {
      case "none":
      case "application/x-www-form-urlencoded":
      case "multipart/form-data":
      case "application/json":
      case "text/plain":
        return value;
    }
  }
  throw new GraphQLError('Provided value is not a valid media type', {
    extensions: { code: 'BAD_USER_INPUT' },
  });
}

export const OpenAPIMediaType = new GraphQLScalarType({
  name: 'OpenAPIMediaType',
  description: 'OpenAPI MediaType',
  serialize: _mediaType,
  parseValue: _mediaType,
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new _mediaType(ast.value);
    }
    throw new GraphQLError('Provided value is not a valid media type', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  },
});