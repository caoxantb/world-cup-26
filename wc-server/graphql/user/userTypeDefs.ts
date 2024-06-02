import gql from "graphql-tag";

const userTypeDefs = gql`
  extend type Query {
    getCurrentUser: User
  }

  extend type Mutation {
    signupWithPassword(email: String!, password: String!, name: String!): User
    loginWithPassword(email: String!, password: String!): User
    logout: String
  }

  type User {
    _id: ID!
    googleId: ID
    name: String!
    email: String!
    picture: String!
    passwordHash: String
    gameplay: [Gameplay!]!
  }
`;
export default userTypeDefs;
