import gql from "graphql-tag";

const roundTypeDefs = gql`
  extend type Mutation {
    createAllRounds: String
  }
  
  type Round {
    _id: ID!
    code: String
    name: String!
    type: RoundType
    isTwoLegs: Boolean
    matches: [ID!]!
    teams: [RoundTeam!]!
    numberOfTeams: Int!
    numberOfGroups: Int
    groupStage: [GroupStage!]
    gameplay: ID!
  }

  enum RoundType { 
    KNOCKOUT
    ROUNDROBIN
  }

  type RoundTeam {
    team: String!
    status: TeamStatus!
    advancedTo: String
  }

  enum TeamStatus {
    ADVANCED
    ELIMINATED
    UNDETERMINED
  }

  type GroupStage {
    groupName: String!
    groupData: [GroupData!]!
  }
  
  type GroupData {
    team: String!
    matchesPlayed: Int!
    wins: Int!
    draws: Int!
    losses: Int!
    goalsFor: Int!
    goalsAgainst: Int!
    goalsDifference: Int!
    points: Int!
  }
`;

export default roundTypeDefs;
