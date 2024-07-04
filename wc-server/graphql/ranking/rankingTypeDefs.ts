import gql from "graphql-tag";

const rankingTypeDefs = gql`
  scalar Date

  extend type Query {
    teamPastRankings(code: String!, gameplay: String!): [Ranking!]!
  }

  type Ranking {
    date: Date!
    position: Number!
    points: Number!
    gameplay: ID
  }
`;

export default rankingTypeDefs;
