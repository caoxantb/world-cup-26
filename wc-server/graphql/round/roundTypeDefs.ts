import gql from "graphql-tag";

const roundTypeDefs = gql`
  extend type Query {
    _: String
  }

  extend type Mutation {
    createAllRounds: String
    updateGroupTables(
      code: String!
      gameplay: ID!
      matches: [ID!]!
      groups: [String!]
    ): String
    updateKnockoutAdvancedStatus(
      code: String!
      gameplayId: ID!
      matches: [ID!]!
    ): String
    updateGroupStageAdvancedStatus(
      code: String!
      gameplayId: ID!
      matchDate: Date!
      groups: [String!]
    ): String
  }

  type Round {
    _id: ID!
    code: String!
    matches: [ID!]!
    teams: [RoundTeam!]!
    groupStage: [GroupStage!]
    gameplay: ID!
  }

  type RoundStatic {
    federation: String!
    hosts: Int!
    code: String!
    name: String!
    type: RoundType!
    legs: Int!
    numberOfTeams: Int!
    numberOfGroups: Int!
    entryTeams: [Int!]!
    advancedTo: JsonObject
  }
  enum RoundType {
    knockout
    roundrobin
  }

  type RoundTeam {
    team: String!
    status: TeamStatus!
    advancedTo: String
  }

  enum TeamStatus {
    advanced
    eliminated
    undetermined
    finished
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

  type RoundByDate {
    code: String!
    matchday: Int
    groups: [String]
  }
`;

export default roundTypeDefs;
