import { dateScalar, numberScalar } from "../custom-scalar";

const resolvers = {
  Date: dateScalar,
  Number: numberScalar,
  Query: {
    _: () => "Hello World",
  },
};

export default resolvers;