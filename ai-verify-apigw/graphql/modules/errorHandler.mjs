import { GraphQLError } from "graphql";

export function graphqlErrorHandler(error, msg, reject) {
  console.log(error);
  let errorrMsg;
  if (error.message) {
      errorrMsg = error.message
  }
  reject(`${msg} - ${errorrMsg}`);
}

