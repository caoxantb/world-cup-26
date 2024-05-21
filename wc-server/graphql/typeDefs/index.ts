import gql from "graphql-tag";

const typeDefs = gql`
  scalar Date
  scalar Number

  type Query {
    _: String
  }
`;

export default typeDefs;