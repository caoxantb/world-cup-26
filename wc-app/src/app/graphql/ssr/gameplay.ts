export async function getGameplay(id: string) {
  const res = await fetch("http://localhost:8080/graphql", {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query AccessGameplay($id: ID!) {
          accessGameplay(id: $id) {
            _id
            name
          }
        }
      `,
      variables: { id },
    }),
  });

  const json = await res.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  console.log(json.data.accessGameplay);
}
