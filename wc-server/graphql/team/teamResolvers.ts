import { Request, Response } from "express";
import fs from "fs";
import mongoose from "mongoose";
import { z } from "zod";

import { Ranking, Team, TeamStatic } from "../../models";
import { teamValidator } from "../../models/team";
import { BadRequest, NotFound } from "../../utils/httpError";
import { linearFit } from "../../utils/teamUtils";

export const teamTransforms = {
  currentFIFARanking: async (parents: { code: string; gameplay: string }) => {
    const { code, gameplay } = parents;

    const ranking = await Ranking.findOne({
      team: code,
      $or: [{ gameplay }, { gameplay: { $exists: false } }],
    })
      .sort({ date: -1 })
      .lean();

    return ranking?.position;
  },
};

export const teamQueries = {
  teamData: async (
    parents: undefined,
    args: { code: string; gameplay: string }
  ) => {
    const { code, gameplay } = args;

    const team = await Team.findOne({ code, gameplay })
      .select("currentFIFAPoints")
      .lean();
    const teamStatic = await TeamStatic.findOne({ code })
      .select("name flag logo kits federation pastWorldCupStats homeStadium")
      .lean();

    if (team && teamStatic) {
      return {
        ...team,
        ...teamStatic,
        code,
        gameplay,
      };
    }

    throw new NotFound("Team not found.");
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
      const { code, xGoalData, federation, initialFIFAPoints } = team;
      console.log(team);
      const [xGoalForParams, xGoalAgainstParams] = linearFit(xGoalData);
      return {
        code,
        currentFIFAPoints: initialFIFAPoints,
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
