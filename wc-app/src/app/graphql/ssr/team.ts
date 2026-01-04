import { cookies } from "next/headers";

export async function getTeamData(code: string) {
  const cookieStore = await cookies();
  const gameplay = cookieStore.get("gameplayId")?.value ?? null;

  const res = await fetch("http://localhost:8080/graphql", {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Cookie: gameplay ? `gameplay_id=${gameplay}` : "",
    },
    body: JSON.stringify({
      query: `
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
      `,
      variables: { code },
    }),
  });

  const json = await res.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  console.log(json.data);

  return json.data.teamData;
}
