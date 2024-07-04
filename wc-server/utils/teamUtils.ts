import { Ranking, Team } from "../models";
import { BadRequest } from "./httpError";

export const populateTeamData = async (teamCode: string, gameplay: string) => {
  const team = await Team.findOne({
    code: teamCode,
    gameplay: gameplay,
  });

  if (!team) {
    throw new BadRequest("Team(s) not found");
  }

  const ranking = await Ranking.findOne({
    team: teamCode,
    $or: [{ gameplay }, { gameplay: { $exists: false } }],
  })
    .sort({ date: -1 })
    .lean();

  if (!ranking) throw new BadRequest("Team ranking is required");

  return { team, ranking: ranking.position };
};

export const updateTeamData = (
  team: any,
  teamGoals: number,
  opponentGoals: number,
  rankDiff: number
) => {
  const { xGoalData } = team;

  xGoalData.numberOfDataPoints++;
  xGoalData.sumRankDiff += rankDiff;
  xGoalData.sumGoalsScored += teamGoals;
  xGoalData.sumGoalsConceded += opponentGoals;
  xGoalData.sumRankDiffSquare += rankDiff ** 2;
  xGoalData.sumDotScored += teamGoals * rankDiff;
  xGoalData.sumDotConceded += opponentGoals * rankDiff;

  const [xGoalForParams, xGoalAgainstParams] = linearFit(xGoalData);

  Object.assign(team, {
    xGoalData,
    xGoalForParams,
    xGoalAgainstParams,
  });
};

export const updateFIFAPoints = (
  team: any,
  opponent: any,
  round: string,
  w: number
) => {
  const teamPrevPoints = team.currentFIFAPoints;

  console.log(teamPrevPoints, team.code);

  const opponentPrevPoints = opponent.currentFIFAPoints;
  const prevPointsDiff = teamPrevPoints - opponentPrevPoints;

  const wE = 1 / (10 ** (-prevPointsDiff / 600) + 1);

  const imp = ["FIFA-WC-GS", "FIFA-WC-R32", "FIFA-WC-R16"].includes(round)
    ? 50
    : round.startsWith("FIFA-WC")
    ? 60
    : ["UEFA-NL-A", "UEFA-NL-B", "UEFA-NL-C", "UEFA-NL-D"].includes(round)
    ? 15
    : 25;

  const teamNewPoints =
    ((round.startsWith("FIFA-WC") && round !== "FIFA-WC-GS") ||
      ["UEFA-NL-QF", "UEFA-NL-SF", "UEFA-NL-3P", "UEFA-NL-F"].includes(
        round
      )) &&
    w < wE
      ? teamPrevPoints
      : teamPrevPoints + imp * (w - wE);

  console.log(teamNewPoints, team.code);

  team.currentFIFAPoints = Math.round(teamNewPoints * 100) / 100;
};

export const linearFit = (xGoalData: {
  numberOfDataPoints: number;
  sumRankDiff: number;
  sumGoalsScored: number;
  sumGoalsConceded: number;
  sumRankDiffSquare: number;
  sumDotScored: number;
  sumDotConceded: number;
}) => {
  const {
    numberOfDataPoints,
    sumRankDiff,
    sumGoalsScored,
    sumGoalsConceded,
    sumRankDiffSquare,
    sumDotScored,
    sumDotConceded,
  } = xGoalData;

  const meanRankDiff = sumRankDiff / numberOfDataPoints;
  const meanGoalsScored = sumGoalsScored / numberOfDataPoints;
  const meanGoalsConceded = sumGoalsConceded / numberOfDataPoints;

  const w1 =
    (sumDotScored - meanGoalsScored * sumRankDiff) /
    (sumRankDiffSquare - meanRankDiff * sumRankDiff);
  const b1 = meanGoalsScored - w1 * meanRankDiff;

  const w2 =
    (sumDotConceded - meanGoalsConceded * sumRankDiff) /
    (sumRankDiffSquare - meanRankDiff * sumRankDiff);
  const b2 = meanGoalsConceded - w2 * meanRankDiff;

  return [
    [w1, b1],
    [w2, b2],
  ];
};
