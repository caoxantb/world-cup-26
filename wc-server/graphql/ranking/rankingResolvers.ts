import { Ranking, Team, TeamStatic } from "../../models";

export const rankingQueries = {
  teamPastRankings: async (
    parents: undefined,
    args: { code: string; gameplay?: string }
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
