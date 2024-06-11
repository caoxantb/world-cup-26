import { Request, Response } from "express";
import fs from "fs";
import mongoose from "mongoose";
import { z } from "zod";

import { Ranking, Team, TeamStatic } from "../../models";
import { teamValidator } from "../../models/team";
import { BadRequest } from "../../utils/httpError";
import { linearFit } from "../../utils/linearXGoal";

export const teamQueries = {
  getAllTeams: async () => {
    const ranking = await Ranking.find({ team: "ENG" });
    console.log(ranking);
  },
};

export const teamMutations = {
  createAllTeams: async (
    parents: undefined,
    args: Record<string, never>,
    context: { req: Request; res: Response }
  ) => {
    if (!context.req.gameplay) {
      throw new BadRequest(
        "No gameplay specified. Each team instance must be attached to a predefined gameplay."
      );
    }
    const teamsStatic = JSON.parse(
      fs.readFileSync("./db/json/teams.json", {
        encoding: "utf8",
      })
    );
    const teams = teamsStatic.map((team: any) => {
      const { code, xGoalData, federation, currentFIFAPoints } = team;
      const [xGoalForParams, xGoalAgainstParams] = linearFit(xGoalData);
      return {
        code,
        currentFIFAPoints,
        isHost: ["USA", "CAN", "MEX"].includes(code),
        xGoalData,
        xGoalForParams,
        xGoalAgainstParams,
        federation,
        gameplay: context.req.gameplay,
      };
    });
    const teamsValidated = z.array(teamValidator).safeParse(teams);
    if (!teamsValidated.success) {
      throw new BadRequest("Invalidated request body.");
    }
    await Team.insertMany(teamsValidated.data);
  },
};
