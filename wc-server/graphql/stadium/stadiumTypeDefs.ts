import gql from "graphql-tag";

const stadiumTypeDefs = gql`
  extend type Query {
    getAllCurrentGameplayStadiums(
      type: GameplayType!
      gameplayId: ID
    ): [Stadium!]!
  }

  extend type Mutation {
    createCustomStadiums(stadiums: [StadiumInput!]!): String
  }

  type Stadium {
    _id: ID!
    name: String!
    city: String!
    hostCountry: String!
    hostOpeningMatch: String
    capacity: Int!
    type: GameplayType!
    coordinations: [Float!]!
    group: Number!
    gameplay: ID
  }

  input StadiumInput {
    name: String!
    city: String!
    hostCountry: String!
    hostOpeningMatch: String
    capacity: Int!
    type: GameplayType!
    coordinations: [Float!]!
    group: Number!
    gameplay: ID
  }

  enum GameplayType {
    north_america
    centenario
    custom
  }
`;

export default stadiumTypeDefs;
