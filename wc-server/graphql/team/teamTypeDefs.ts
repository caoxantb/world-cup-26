import gql from "graphql-tag";

const teamTypeDefs = gql`
  scalar Date

  extend type Query {
    #
  }

  type Team {
    _id: ID!
    code: String!
    pastFIFARankings: [PastRankings!]!
    currentFIFAPoints: Int!
    currentFIFARanking: Int!
    isHost: Boolean!
    xGoalData: [XGoalData!]!
    xGoalParams: [Float!]!
    gameplay: ID!
  }

  type TeamStatic {
    _id: ID!
    name: String!
    code: String!
    flag: String!
    logo: String!
    kits: Kits!
    pastFIFARankings: [PastRankings!]!
    pastWorldCupStats: [PastWorldCupStats!]!
    initialUEFARanking: Int!
    xGoalData: [XGoalData!]!
    homeStadium: String!
    federation: String!
  }

  type Kits {
    homeKit: String!
    awayKit: String!
  }

  type PastRankings {
    date: Date!
    position: Int!
  }

  type PastWorldCupStats {
    year: Int!
    place: String!
  }

  type XGoalData {
    thenFIFARanking: Int!
    thenOpponentFIFARanking: Int!
    goalsScored: Int!
  }
`;

export default teamTypeDefs;
