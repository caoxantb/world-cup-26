import mongoose from "mongoose";

import { InternalServerError } from "../utils/httpError";

export const connectDatabase = async (): Promise<void> => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI)
      throw new InternalServerError(
        "Could not connect to a valid Mongo database"
      );
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to database");
  } catch (err) {
    console.error(err);
    throw new InternalServerError(
      "Could not connect to a valid Mongo database"
    );
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
