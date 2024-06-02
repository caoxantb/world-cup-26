import gql from "graphql-tag"

const gameplayTypeDefs = gql`
  extend type Query {
    getCurrentGameplay: Gameplay
  }

  type Gameplay {
    _id: ID!
    currentDate: Date!
  }
`

export default gameplayTypeDefs