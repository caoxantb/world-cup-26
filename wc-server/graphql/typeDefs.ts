import gql from "graphql-tag";

import federationTypeDefs from "./federation/federationTypeDefs";
import gameplayTypeDefs from "./gameplay/gameplayTypeDefs";
import matchTypeDefs from "./match/matchTypeDefs";
import roundTypeDefs from "./round/roundTypeDefs";
import teamTypeDefs from "./team/teamTypeDefs";
import userTypeDefs from "./user/userTypeDefs";

const coreTypeDefs = gql`
  scalar Date
  scalar Number

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
  gameplayTypeDefs,
  // matchTypeDefs,
  roundTypeDefs,
  teamTypeDefs,
  userTypeDefs,
];

export default typeDefs;
