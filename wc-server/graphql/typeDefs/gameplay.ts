import gql from "graphql-tag"

const gameplayTypeDefs = gql`
  extend type Query {
    # current rounds playing in the game based on current date.
  }

  type Gameplay {
    _id: ID!;
    currentDate: Date!;
  }
`

export default gameplayTypeDefs