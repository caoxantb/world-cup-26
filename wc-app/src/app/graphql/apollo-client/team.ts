import { cookies } from "next/headers";
import { ApolloClient, InMemoryCache, HttpLink, gql } from "@apollo/client";

export async function getTeamData(code: string) {
  // 1. Read cookies from the browser (SSR)
  const cookieStore = await cookies();

  console.log(cookieStore);

  const gameplay = cookieStore.get("gameplay_id")?.value ?? "";

  // 2. Build cookie header for SSR
  const cookieHeader = gameplay ? `gameplay_id=${gameplay}` : "";

  // 3. Create SSR Apollo Client with forwarded cookies
  const client = new ApolloClient({
    ssrMode: true,
    link: new HttpLink({
      uri: "http://localhost:8080/graphql",
      credentials: "include",
      headers: {
        Cookie: cookieHeader,
      },
    }),
    cache: new InMemoryCache(),
  });

  // 4. Define query
  const TEAM_DATA = gql`
    query TeamData($code: String!) {
      teamData(code: $code) {
        code
        currentFIFAPoints
        currentFIFARanking
        federation
        flag
        gameplay
        kits {
          awayKit
          homeKit
        }
        logo
        name
        homeStadium
        pastWorldCupStats {
          place
          year
        }
      }
    }
  `;

  // 5. Run query on the server
  const json = await client.query({
    query: TEAM_DATA,
    variables: { code },
    fetchPolicy: "no-cache",
  });

  // 6. Return the result
  console.log(json);
}
