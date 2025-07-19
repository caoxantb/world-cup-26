import dotenv from "dotenv";
import fs from "fs";
import mongoose from "mongoose";
import { z } from "zod";
import stripJsonComments from "strip-json-comments";

import { connectDatabase, disconnectDatabase } from "./connection";
import { getMatchStaticData, getTeamStaticData } from "./scripts/get-static-db";
import {
  TeamStatic,
  MatchStatic,
  Ranking,
  RoundStatic,
  Stadium,
} from "../models";
import { matchStaticValidator } from "../models/matchStatic";
import { rankingValidator } from "../models/ranking";
import { teamStaticValidator } from "../models/teamStatic";
import { roundStaticValidator } from "../models/roundStatic";
import { stadiumValidator } from "../models/stadium";

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
    // const { finalData: teams, fifaRankings: rankings } =
    //   await getTeamStaticData();
    // const matches = await getMatchStaticData();
    // const roundsStatic = JSON.parse(
    //   stripJsonComments(
    //     fs.readFileSync("./db/json/roundsStatic.jsonc", {
    //       encoding: "utf8",
    //     })
    //   )
    // );
    const hostVenues = JSON.parse(
      stripJsonComments(
        fs.readFileSync("./db/json/hostVenues.json", {
          encoding: "utf8",
        })
      )
    );
    // await initCollection(TeamStatic, "TeamStatic", teams, teamStaticValidator);
    // await initCollection(Ranking, "Ranking", rankings, rankingValidator);
    // await initCollection(
    //   MatchStatic,
    //   "MatchStatic",
    //   matches,
    //   matchStaticValidator
    // );
    // await initCollection(
    //   RoundStatic,
    //   "RoundStatic",
    //   roundsStatic,
    //   roundStaticValidator
    // );
    await initCollection(Stadium, "Stadium", hostVenues, stadiumValidator);
  } catch (err) {
    console.error(err);
  } finally {
    await disconnectDatabase();
  }
})();
