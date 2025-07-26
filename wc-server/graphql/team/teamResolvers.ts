import { Request, Response } from "express";
import { z } from "zod";

import { Ranking, Team, TeamStatic } from "../../models";
import { teamValidator } from "../../models/team";
import { BadRequest, NotFound } from "../../utils/httpError";
import { getHosts, linearFit } from "../../utils/teamsUtils";

export const teamTransforms = {
  currentFIFARanking: async (parents: { code: string; gameplay: string }) => {
    const { code, gameplay } = parents;

    const ranking = await Ranking.findOne({
      team: code,
      $or: [{ gameplay }, { gameplay: { $exists: false } }],
    })
      .sort({ date: -1 })
      .limit(1)
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
  allTeamsByFederation: async (
    parents: undefined,
    args: { federation?: string; isSortedByUEFARanking?: boolean }
  ) => {
    const { federation, isSortedByUEFARanking } = args;

    const teamsStatic = await TeamStatic.find(
      federation ? { federation } : {}
    ).sort({
      [federation === "UEFA" && isSortedByUEFARanking
        ? "initialUEFARanking"
        : "initialFIFAPoints"]: 1,
    });

    return teamsStatic.map((team) => team?.name);
  },
};

export const teamMutations = {
  createAllTeams: async (
    parents: undefined,
    args: Record<string, never>,
    context: { req: Request; res: Response }
  ) => {
    const {
      req: { gameplay },
    } = context;

    if (!gameplay) {
      throw new BadRequest(
        "No gameplay specified. Each team instance must be attached to a predefined gameplay."
      );
    }

    const { hosts } = gameplay;

    const hostArr = getHosts(hosts);
    const teamsStatic = await TeamStatic.find();

    const teams = teamsStatic.map((team: any) => {
      const { code, xGoalData, federation, initialFIFAPoints } = team;
      const [xGoalForParams, xGoalAgainstParams] = linearFit(xGoalData);
      return {
        code,
        currentFIFAPoints: initialFIFAPoints,
        isHost: hostArr.includes(code),
        xGoalData,
        xGoalForParams,
        xGoalAgainstParams,
        federation,
        gameplay: gameplay._id,
      };
    });
    const teamsValidated = z.array(teamValidator).safeParse(teams);
    if (!teamsValidated.success) {
      throw new BadRequest("Invalidated request body.");
    }
    await Team.insertMany(teamsValidated.data);
  },
};
