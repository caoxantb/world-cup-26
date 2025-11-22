import { dateScalar, jsonObjectScalar, numberScalar } from "./customScalar";
import {
  gameplayMutations,
  gameplayQueries,
} from "./gameplay/gameplayResolvers";
import { matchQueries, matchesMutation } from "./match/matchResolvers";
import { rankingQueries } from "./ranking/rankingResolvers";
import { roundQueries, roundMutations } from "./round/roundResolvers";
import { stadiumMutations, stadiumQueries } from "./stadium/stadiumResolvers";
import {
  teamQueries,
  teamMutations,
  teamTransforms,
} from "./team/teamResolvers";
import { userMutations, userQueries } from "./user/userResolvers";

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
