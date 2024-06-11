import { dateScalar, numberScalar } from "./customScalar";
import { gameplayMutations } from "./gameplay/gameplayResolvers";
import { roundMutations } from "./round/roundResolvers";
import { teamQueries, teamMutations } from "./team/teamResolvers";
import { userMutations, userQueries } from "./user/userResolvers";

const resolvers = {
  Date: dateScalar,
  Number: numberScalar,
  Query: {
    ...teamQueries,
    ...userQueries,
  },
  Mutation: {
    ...gameplayMutations,
    ...userMutations,
    ...teamMutations,
    ...roundMutations,
  },
};

export default resolvers;
