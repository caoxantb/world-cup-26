import gql from "graphql-tag";

const teamTypeDefs = gql`
  scalar Date

  extend type Query {
    teamData(code: String!, gameplay: String!): Team
    allTeamsByFederation(
      federation: String
      isSortedByUEFARanking: Boolean
    ): [String]
  }

  extend type Mutation {
    createAllTeams: String
  }

  type Team {
    code: String!
    name: String!
    flag: String!
    logo: String!
    kits: Kits!
    currentFIFARanking: Int!
    currentFIFAPoints: Float!
    federation: String!
    gameplay: ID!
    pastWorldCupStats: [PastWorldCupStat!]!
    homeStadium: String!
  }

  type TeamCore {
    code: String!
    name: String!
    flag: String!
    logo: String!
    federation: String!
  }

  type Kits {
    homeKit: String!
    awayKit: String!
  }

  type PastWorldCupStat {
    year: Int!
    place: String!
  }

  type XGoalData {
    numberOfDataPoints: Int!
    sumRankDiff: Int!
    sumGoalsScored: Int!
    sumGoalsConceded: Int!
    sumRankDiffSquare: Int!
    sumDotScored: Int!
    sumDotConceded: Int!
  }
`;

export default teamTypeDefs;
