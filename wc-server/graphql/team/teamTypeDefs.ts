import gql from "graphql-tag";

const teamTypeDefs = gql`
  scalar Date

  extend type Query {
    getAllTeams: [Team]
  }

  extend type Mutation {
    createAllTeams: String
  }

  type Team {
    _id: ID!
    code: String!
    currentFIFAPoints: Float!
    isHost: Boolean!
    xGoalData: XGoalData!
    xGoalForParams: [Float!]!
    xGoalAgainstParams: [Float!]!
    federation: String!
    gameplay: ID!
  }

  type TeamStatic {
    _id: ID!
    name: String!
    code: String!
    flag: String!
    logo: String!
    kits: Kits!
    currentFIFAPoints: Float!
    pastWorldCupStats: [PastWorldCupStats!]!
    initialUEFARanking: Int!
    xGoalData: XGoalData!
    homeStadium: String!
    federation: String!
  }

  type Kits {
    homeKit: String!
    awayKit: String!
  }

  type PastWorldCupStats {
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
