import { dateScalar, numberScalar } from "./customScalar";
import { userMutations, userQueries } from "./user/userResolvers";

const resolvers = {
  Date: dateScalar,
  Number: numberScalar,
  Query: {
    _: () => "Hello World",
    ...userQueries
  },
  Mutation: {
    ...userMutations,
  },
};

export default resolvers;
