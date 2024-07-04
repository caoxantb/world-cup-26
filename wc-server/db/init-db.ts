import dotenv from "dotenv";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDatabase, disconnectDatabase } from "./connection";
import { getMatchStaticData, getTeamStaticData } from "./scripts/get-static-db";
import { TeamStatic, MatchStatic, Ranking } from "../models";
import { matchStaticValidator } from "../models/matchStatic";
import { rankingValidator } from "../models/ranking";
import { teamStaticValidator } from "../models/teamStatic";

dotenv.config();

const initCollection = async (
  collection: mongoose.Model<any>,
  name: string,
  data: unknown,
  validator: z.AnyZodObject
) => {
  const dataValidated = z.array(validator).safeParse(data);
  if (!dataValidated.success) {
    console.error(dataValidated.error);
    return;
  }
  await collection.deleteMany();
  const dataInit = await collection.insertMany(dataValidated.data);
  console.log(
    `Created and inserted ${dataInit.length} documents to ${name} collection.`
  );
};

(async () => {
  await connectDatabase();
  try {
    const { finalData: teams, fifaRankings: rankings } =
      await getTeamStaticData();
    const matches = await getMatchStaticData();

    await initCollection(TeamStatic, "TeamStatic", teams, teamStaticValidator);
    await initCollection(Ranking, "Ranking", rankings, rankingValidator);
    await initCollection(MatchStatic, "MatchStatic", matches, matchStaticValidator);
  } catch (err) {
    console.error(err);
  } finally {
    await disconnectDatabase();
  }
})();
