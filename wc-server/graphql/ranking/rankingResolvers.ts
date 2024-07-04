import { Request, Response } from "express";
import { Ranking, Team, TeamStatic } from "../../models";

export const rankingQueries = {
  teamPastRankings: async (
    parents: undefined,
    args: { code: String; gameplay?: String }
  ) => {
    const { code, gameplay } = args;
    const rankings = await Ranking.find({
      team: code,
      $or: [{ gameplay }, { gameplay: { $exists: false } }],
    })
      .sort({ date: -1 })
      .lean();
    return rankings;
  },
};
