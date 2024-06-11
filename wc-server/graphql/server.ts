import { ApolloServer, BaseContext } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { useServer } from "graphql-ws/lib/use/ws";
import { Server } from "http";
import { WebSocketServer } from "ws";

import resolvers from "./resolvers";
import typeDefs from "./typeDefs";

export const createGraphQLServer = (
  httpServer: Server
): ApolloServer<BaseContext> => {
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const serverCleanup = useServer(
    { schema },
    new WebSocketServer({
      server: httpServer,
      path: "/graphql",
    })
  );

  const server = new ApolloServer<BaseContext>({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  return server;
};
