import gql from "graphql-tag";

import federationTypeDefs from "./federation/federationTypeDefs";
import gameplayTypeDefs from "./gameplay/gameplayTypeDefs";
import matchTypeDefs from "./match/matchTypeDefs";
import rankingTypeDefs from "./ranking/rankingTypeDefs";
import roundTypeDefs from "./round/roundTypeDefs";
import teamTypeDefs from "./team/teamTypeDefs";
import userTypeDefs from "./user/userTypeDefs";
import stadiumTypeDefs from "./stadium/stadiumTypeDefs";

const coreTypeDefs = gql`
  scalar Date
  scalar Number
  scalar JsonObject

  type Query {
    _: String
  }

  type Mutation {
    _: String
  }
`;

const typeDefs = [
  coreTypeDefs,
  // federationTypeDefs,
  stadiumTypeDefs,
  gameplayTypeDefs,
  matchTypeDefs,
  rankingTypeDefs,
  roundTypeDefs,
  teamTypeDefs,
  userTypeDefs,
];

export default typeDefs;
