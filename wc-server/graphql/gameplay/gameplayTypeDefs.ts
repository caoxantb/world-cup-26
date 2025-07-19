import gql from "graphql-tag";

const gameplayTypeDefs = gql`
  extend type Query {
    accessGameplay(id: ID!): Gameplay
  }

  extend type Mutation {
    createNewGameplay(
      name: String!
      type: GameplayType!
      hosts: [HostsInput!]!
    ): String
  }

  type Gameplay {
    _id: ID!
    name: String!
    ingameCurrentDate: Date!
    type: GameplayType!
    user: ID!
    hosts: [Hosts!]!
  }

  type Hosts {
    name: String!
    order: Number!
    federation: String!
  }

  input HostsInput {
    name: String!
    order: Number!
    federation: String!
  }

  enum GameplayType {
    north_america
    centenario
    custom
  }
`;

export default gameplayTypeDefs;
