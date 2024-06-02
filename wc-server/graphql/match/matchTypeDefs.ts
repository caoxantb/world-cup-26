import gql from "graphql-tag";

const matchTypeDefs = gql`
  extend type Query {
    #
  }

  type Match {
    _id: ID!
    code: String
    homeTeam: Team!
    awayTeam: Team!
    date: Date!
    stadium: String
    isNeutralVenue: Boolean
    round: String!
    leg: Leg
    group: String
    homeTeamGoals: Int!
    awayTeamGoals: Int!
    homeTeamExtraTimeGoals: Int
    awayTeamExtraTimeGoals: Int
    goalMinutes: [Number!]!
    homeTeamAggs: Int
    awayTeamAggs: Int
    homeTeamPenalties: Int
    awayTeamPenalties: Int
    gameplay: ID!
  }

  type MatchStatic {
    _id: ID!
    homeTeam: Team!
    awayTeam: Team!
    date: Date!
    isNeutralVenue: Boolean
    round: String!
    homeTeamGoals: Int!
    awayTeamGoals: Int!
  }

  enum Leg {
    _1ST
    _2ND
  }
`;

export default matchTypeDefs;
