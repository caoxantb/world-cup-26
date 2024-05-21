import gql from "graphql-tag";

const federationTypeDefs = gql`
  extend type Query {
    #
  }

  type Federation { 
    _id: ID!
    name: String!
    code: String!
    logo: String!
    rounds: [String!]!
  }
`;

export default federationTypeDefs;
