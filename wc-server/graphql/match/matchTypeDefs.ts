import gql from "graphql-tag";

const matchTypeDefs = gql`
  scalar Number

  extend type Query {
    matchesByRound(
      gameplay: ID!
      roundCode: String!
      matchday: Int
      groups: [String!]
    ): [Match!]!
    pastMatches(
      team1: String!
      team2: String!
      gameplay: String!
      limit: Int
    ): PastMatches
  }

  extend type Mutation {
    createMatches(
      groups: [[String!]!]!
      gameplayId: ID!
      roundCode: String!
    ): String
    playMatches(
      matchId: ID!
      gameplay: String!
      homeTeamGoals: Int
      awayTeamGoals: Int
      homeTeamExtraTimeGoals: Int
      awayTeamExtraTimeGoals: Int
      penaltiesWinner: String
    ): Match
  }

  type PastMatches {
    overview: PastMatchesOverview!
    matches: [MatchStatic!]!
  }

  type PastMatchesOverview {
    team1Wins: Int!
    team2Wins: Int!
    draws: Int!
    team1Goals: Int!
    team2Goals: Int!
  }

  type Match {
    code: String
    homeTeam: Team!
    awayTeam: Team!
    date: Date!
    stadium: String
    isNeutralVenue: Boolean
    round: String!
    leg: Int
    group: String
    matchday: Int
    homeTeamGoals: Int
    awayTeamGoals: Int
    homeTeamExtraTimeGoals: Int
    awayTeamExtraTimeGoals: Int
    homeTeamGoalMinutes: [Number!]
    awayTeamGoalMinutes: [Number!]
    homeTeamAggs: Int
    awayTeamAggs: Int
    teamTakenFirstPenalty: String
    homeTeamPenalties: Int
    awayTeamPenalties: Int
    homeTeamPenaltiesGoals: [Int!]
    awayTeamPenaltiesGoals: [Int!]
    gameplay: ID!
  }

  type MatchStatic {
    homeTeam: String!
    awayTeam: String!
    date: Date!
    isNeutralVenue: Boolean
    round: String!
    homeTeamGoals: Int!
    awayTeamGoals: Int!
  }
`;

export default matchTypeDefs;
