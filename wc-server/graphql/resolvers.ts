import { dateScalar, numberScalar } from "./customScalar";
import { gameplayMutations } from "./gameplay/gameplayResolvers";
import { roundMutations } from "./round/roundResolvers";
import { rankingQueries } from "./ranking/rankingResolvers";
import {
  teamQueries,
  teamMutations,
  teamTransforms,
} from "./team/teamResolvers";
import { userMutations, userQueries } from "./user/userResolvers";
import { matchQueries, matchesMutation } from "./match/matchResolvers";

const resolvers = {
  Date: dateScalar,
  Number: numberScalar,
  Team: teamTransforms,
  Query: {
    ...matchQueries,
    ...rankingQueries,
    ...teamQueries,
    ...userQueries,
  },
  Mutation: {
    ...gameplayMutations,
    ...matchesMutation,
    ...userMutations,
    ...teamMutations,
    ...roundMutations,
  },
};

export default resolvers;
