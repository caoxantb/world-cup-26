import gql from "graphql-tag"

const gameplayTypeDefs = gql`
  extend type Query {
    getCurrentGameplay: Gameplay
  }

  extend type Mutation {
    createNewGameplay(name: String!): String
  }

  type Gameplay {
    _id: ID!
    currentDate: Date!
  }
`

export default gameplayTypeDefs