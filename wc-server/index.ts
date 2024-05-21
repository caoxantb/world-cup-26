import http from "http";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import "express-async-errors";
import { expressMiddleware } from '@apollo/server/express4';

import { connectDatabase } from "./db/connection";
import { createGraphQLServer } from "./graphql/server";
import { errorHandler } from "./middlewares/error";

dotenv.config();

const initServer = async () => {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = process.env.PORT || 8080;
  const server = createGraphQLServer(httpServer);

  await connectDatabase();
  await server.start();

  app.use(cors({ credentials: true, origin: true }))
  app.use(express.json());
  app.use("/", expressMiddleware(server));
  app.use(errorHandler);

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

initServer();