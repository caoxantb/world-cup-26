import { expressMiddleware } from "@apollo/server/express4";
import cookieParser, { CookieParseOptions } from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import "express-async-errors";

import { connectDatabase } from "./db/connection";
import { createGraphQLServer } from "./graphql/server";
import { authenticateUser } from "./middlewares/auth";
import { errorHandler } from "./middlewares/error";

dotenv.config();

const initServer = async () => {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = process.env.PORT || 8080;
  const server = createGraphQLServer(httpServer);
  const cookieOptions = {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // one week
    path: "/",
    sameSite: "strict",
    secure: false,
  };
  const cookieSecret = process.env.COOKIE_SECRET;

  await connectDatabase();
  await server.start();

  app.set("cookieOptions", cookieOptions);
  app.set("cookieSecret", cookieSecret);

  app.use(cookieParser(cookieSecret));
  app.use(cors({ credentials: true, origin: true }));
  app.use(express.json());
  app.use(authenticateUser);
  app.use(
    "/",
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        return { req, res };
      },
    })
  );
  app.use(errorHandler);

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

initServer();
