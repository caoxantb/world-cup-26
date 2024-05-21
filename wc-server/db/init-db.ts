import { z } from "zod";
import dotenv from "dotenv";

import { connectDatabase, disconnectDatabase } from "./connection";
import { TeamStatic, MatchStatic } from "../model";
import { getMatchStaticData, getTeamStaticData } from "./scripts/get-static-db";
import { teamStaticValidator } from "../model/teamStatic";
import { matchStaticValidator } from "../model/matchStatic";

dotenv.config();

(async () => {
  await connectDatabase();
  try {
    const teams = await getTeamStaticData();
    const teamStaticValidation = z.array(teamStaticValidator).safeParse(teams);
    if (!teamStaticValidation.success) {
      console.error(teamStaticValidation.error);
      return;
    }

    const matches = await getMatchStaticData();
    const matchStaticValidation = z
      .array(matchStaticValidator)
      .safeParse(matches);
    if (!matchStaticValidation.success) {
      console.error(matchStaticValidation.error);
      return;
    }

    await TeamStatic.deleteMany();
    await MatchStatic.deleteMany();

    const teamStaticInit = await TeamStatic.insertMany(teams);
    console.log(
      `Created and inserted ${teamStaticInit.length} documents to TeamStatic collection.`
    );

    const matchStaticInit = await MatchStatic.insertMany(matches);
    console.log(
      `Created and inserted ${matchStaticInit.length} documents to MatchStatic collection.`
    );
  } catch (err) {
    console.error(err);
  } finally {
    await disconnectDatabase();
  }
})();
