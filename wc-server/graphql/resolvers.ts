import { dateScalar, jsonObjectScalar, numberScalar } from "./customScalar";
import {
  gameplayMutations,
  gameplayQueries,
} from "./gameplay/gameplayResolvers";
import { roundQueries, roundMutations } from "./round/roundResolvers";
import { rankingQueries } from "./ranking/rankingResolvers";
import {
  teamQueries,
  teamMutations,
  teamTransforms,
} from "./team/teamResolvers";
import { userMutations, userQueries } from "./user/userResolvers";
import { matchQueries, matchesMutation } from "./match/matchResolvers";
import { stadiumMutations, stadiumQueries } from "./stadium/stadiumResolvers";

const resolvers = {
  Date: dateScalar,
  Number: numberScalar,
  JsonObject: jsonObjectScalar,
  Team: teamTransforms,
  Query: {
    ...gameplayQueries,
    ...matchQueries,
    ...rankingQueries,
    ...roundQueries,
    ...teamQueries,
    ...userQueries,
    ...stadiumQueries,
  },
  Mutation: {
    ...gameplayMutations,
    ...matchesMutation,
    ...userMutations,
    ...teamMutations,
    ...roundMutations,
    ...stadiumMutations,
  },
};

export default resolvers;
